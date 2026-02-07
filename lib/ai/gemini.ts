import {
    GoogleGenerativeAI,
    FunctionCallingMode,
    type FunctionDeclaration,
    type Part,
} from "@google/generative-ai";
import type { BrandConstitution, CanvasElement } from "@/lib/types";
import type { AuditResult } from "@/lib/types";
import { AGENT_TOOLS, type AgentState, type AgentAction } from "./tools";
import {
    BrandConstitutionSchema,
    AuditResultSchema,
    zodToGeminiSchema,
    type ImageConfig,
} from "./schemas";

// ============ CLIENT INITIALIZATION ============

function getGeminiClient(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    return new GoogleGenerativeAI(apiKey);
}

// ============ THINKING MODE ============

/**
 * Dynamic thinking level selector for optimal speed/quality balance
 * Used across all Gemini 3 operations for intelligent resource allocation
 */
type ThinkingLevel = "minimal" | "low" | "medium" | "high";

function getThinkingLevel(operation: string): ThinkingLevel {
    switch (operation) {
        // Deep reasoning needed - brand identity is critical
        case "analyze_canvas":
            return "medium";
        // Compliance requires careful evaluation
        case "audit_compliance":
            return "medium";
        // Agent orchestration needs smart decisions
        case "agent_loop":
            return "medium";
        // Creative/simple operations - speed priority
        case "generate_image":
        case "search_trends":
        case "refine_prompt":
            return "low";
        // Terminal operations - minimal overhead
        case "complete_task":
        case "generate_thinking":
            return "minimal";
        default:
            return "low";
    }
}

/**
 * Generate reasoning/thinking for an action (visible AI reasoning)
 */
export async function generateThinking(
    context: string,
    action: string
): Promise<string> {
    const client = getGeminiClient();
    // Use Gemini 3 Flash with thinking config
    const model = client.getGenerativeModel({
        model: "gemini-3-flash-preview",
    });

    const prompt = `You are explaining your thought process as an AI agent.

CONTEXT: ${context}
ACTION YOU'RE ABOUT TO TAKE: ${action}

Explain your reasoning in 2-3 sentences. Be specific about WHY you chose this action.
Write in first person ("I noticed...", "I'm choosing to...").`;

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                // @ts-expect-error - thinking config is valid in Gemini 3
                thinkingConfig: {
                    includeThoughts: true,
                    thinkingLevel: getThinkingLevel("generate_thinking"),
                },
                temperature: 1.0,
            },
        }, { timeout: 30000 }); // 30s max for thinking explanation
        return result.response.text().trim();
    } catch (error) {
        console.error("Thinking generation error:", error);
        return `Executing ${action}...`;
    }
}

// ============ GOOGLE SEARCH GROUNDING ============

/**
 * Search the web for brand/trend research using Gemini with Google Search
 */
export async function searchWebForContext(query: string): Promise<string> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
        model: "gemini-3-flash-preview",
        // @ts-expect-error - tools with google search is valid
        tools: [{ googleSearch: {} }],
        generationConfig: { temperature: 1.0 },
    });

    try {
        const result = await model.generateContent(
            `Search and summarize: ${query}. Focus on visual trends, colors, and design patterns.`,
            { timeout: 600000 }
        );
        return result.response.text();
    } catch (error) {
        console.error("Search error:", error);
        return "";
    }
}

// ============ TOOL EXECUTION ============

/**
 * Execute a tool call and return the result
 * 
 * NOTE: Thinking is now handled natively by the agent loop's thinkingConfig.
 * We removed the duplicate generateThinking() call to save tokens (~50% reduction).
 */
export async function executeTool(
    toolName: string,
    args: Record<string, unknown>,
    state: AgentState
): Promise<{ result: unknown; state: AgentState }> {

    switch (toolName) {
        case "analyze_canvas": {
            // CRITICAL: Use ORIGINAL elements from state with actual image data,
            // NOT the model's function call args (which are text-only descriptions)
            const elements = state.canvasElements || (args.canvas_elements as CanvasElement[]);
            if (!elements || elements.length === 0) {
                return {
                    result: { success: false, error: "No canvas elements provided" },
                    state,
                };
            }
            console.log(`Analyzing ${elements.length} canvas elements with image data...`);
            const constitution = await analyzeCanvasForConstitution(elements);
            return {
                result: { success: true, constitution },
                state: { ...state, constitution, phase: "analyzing" },
            };
        }

        case "generate_image": {
            const prompt = args.prompt as string;
            const styleGuide = args.style_guide as string | undefined;
            const colorPalette = args.color_palette as string[] | undefined;
            const forbidden = args.forbidden_elements as string[] | undefined;
            const aspectRatio = args.aspect_ratio as ImageConfig["aspectRatio"] | undefined;
            const imageSize = args.image_size as ImageConfig["imageSize"] | undefined;

            // Retry logic with exponential backoff for resilience
            let imageBase64: string | null = null;
            let lastError: Error | null = null;
            const maxImageRetries = 3;

            for (let attempt = 1; attempt <= maxImageRetries; attempt++) {
                try {
                    imageBase64 = await generateImageWithNanoBanana(prompt, {
                        styleGuide,
                        colorPalette,
                        forbiddenElements: forbidden,
                        aspectRatio,
                        imageSize,
                    });
                    break; // Success
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    console.warn(`Image generation attempt ${attempt}/${maxImageRetries} failed:`, lastError.message);
                    if (attempt < maxImageRetries) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                    }
                }
            }

            // Graceful degradation: if all retries fail, return error for agent to handle
            if (!imageBase64) {
                return {
                    result: {
                        success: false,
                        error: `Image generation failed after ${maxImageRetries} attempts: ${lastError?.message || 'Unknown error'}`,
                        retry_suggested: true,
                    },
                    state: {
                        ...state,
                        phase: "generating",
                        attempts: state.attempts + 1,
                    },
                };
            }

            return {
                result: { success: true, image_generated: true },
                state: {
                    ...state,
                    currentImage: imageBase64,
                    phase: "generating",
                    attempts: state.attempts + 1,
                },
            };
        }

        case "audit_compliance": {
            const imageBase64 = state.currentImage || (args.image_base64 as string);
            const constitution = state.constitution || (args.constitution as BrandConstitution);

            if (!imageBase64 || !constitution) {
                return {
                    result: { success: false, error: "Missing image or constitution" },
                    state,
                };
            }

            const auditResult = await auditImageCompliance(imageBase64, constitution);

            return {
                result: {
                    success: true,
                    compliance_score: auditResult.compliance_score,
                    pass: auditResult.pass,
                    issues: (auditResult.heatmap_coordinates || []).map((h) => h.issue),
                    fix_instructions: auditResult.fix_instructions,
                },
                state: {
                    ...state,
                    auditScore: auditResult.compliance_score,
                    phase: "auditing",
                },
            };
        }

        case "refine_prompt": {
            const originalPrompt = args.original_prompt as string;
            const feedback = args.audit_feedback as string;
            const issues = args.issues as string[] | undefined;

            const refinedPrompt = await refinePromptBasedOnFeedback(
                originalPrompt,
                feedback,
                issues
            );

            return {
                result: { success: true, refined_prompt: refinedPrompt },
                state: { ...state, phase: "refining" },
            };
        }

        case "search_trends": {
            const query = args.query as string;
            const searchResults = await searchWebForContext(query);
            return {
                result: { success: true, search_results: searchResults },
                state,
            };
        }

        case "complete_task": {
            return {
                result: {
                    success: args.success,
                    message: args.message,
                    final_image: (args.final_image_base64 as string) || (args.success ? state.currentImage : null),
                },
                state: { ...state, phase: "complete" },
            };
        }

        default:
            return {
                result: { error: `Unknown tool: ${toolName}` },
                state,
            };
    }
}

// ============ NANO BANANA IMAGE GENERATION ============

/**
 * Generate an image using Gemini's native Nano Banana Pro capability
 * Supports 4K resolution via imageConfig
 */
export async function generateImageWithNanoBanana(
    prompt: string,
    options?: {
        styleGuide?: string;
        colorPalette?: string[];
        forbiddenElements?: string[];
        aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
        imageSize?: "1K" | "2K" | "4K";
    }
): Promise<string> {
    const client = getGeminiClient();
    const {
        styleGuide,
        colorPalette,
        forbiddenElements,
        aspectRatio = "1:1",
        imageSize = "2K",
    } = options || {};

    // Build enhanced prompt with brand constraints
    let enhancedPrompt = prompt;

    if (styleGuide) {
        enhancedPrompt += `\n\nSTYLE GUIDE: ${styleGuide}`;
    }

    if (colorPalette && colorPalette.length > 0) {
        enhancedPrompt += `\n\nCOLOR PALETTE: Use primarily these colors: ${colorPalette.join(", ")}`;
    }

    if (forbiddenElements && forbiddenElements.length > 0) {
        enhancedPrompt += `\n\nFORBIDDEN (DO NOT INCLUDE): ${forbiddenElements.join(", ")}`;
    }

    // Map image size to descriptive pixel targets
    const sizeMap = {
        "1K": "1024x1024",
        "2K": "2048x2048",
        "4K": "4096x4096",
    };

    // Inject resolution intent into prompt to ensure high quality
    enhancedPrompt += `\n\nRESOLUTION: Please target ${imageSize} (${sizeMap[imageSize as keyof typeof sizeMap]}) quality with extreme detail.`;

    // Use Nano Banana Pro (gemini-3-pro-image-preview) 
    const model = client.getGenerativeModel({
        model: "gemini-3-pro-image-preview",
        generationConfig: {
            // @ts-expect-error - Gemini 3 preview properties not in SDK types
            responseModalities: ["image", "text"],
            imageConfig: {
                aspectRatio,
            },
            // Note: thinkingLevel is not supported for gemini-3-pro-image-preview
            // The model thinks by default when generating images.
            temperature: 1.0,
        },
    });

    try {
        const response = await model.generateContent(enhancedPrompt, { timeout: 600000 });
        const parts = response.response.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
                return part.inlineData.data; // Base64 encoded image
            }
        }

        throw new Error("No image generated in response");
    } catch (error) {
        console.error("Nano Banana generation error:", error);
        // Throw error for proper handling - no placeholders in production
        throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// ============ CANVAS ANALYSIS ============

/**
 * Analyze canvas elements and generate Brand Constitution
 * Sends actual images to Gemini for deep visual analysis
 */
export async function analyzeCanvasForConstitution(
    elements: CanvasElement[]
): Promise<BrandConstitution> {
    const client = getGeminiClient();

    // NOTE: responseSchema does NOT work reliably with multimodal image content
    // It causes Gemini to return nulls. We use responseMimeType for JSON + prompt enforcement.
    const model = client.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: {
            responseMimeType: "application/json",
            // responseSchema removed - conflicts with multimodal content
            temperature: 1.0,
        },
    }, { timeout: 90000 }); // 90s for image analysis

    // Build multimodal content with actual images
    const contentParts: Part[] = [];

    // Collect text context and image data separately
    const textDescriptions: string[] = [];
    const imageElements: { name: string; data: string; mimeType: string }[] = [];

    for (const el of elements) {
        if (el.type === "image" && el.url) {
            // Extract base64 from data URL (format: data:image/png;base64,xxx)
            const dataUrlMatch = el.url.match(/^data:([^;]+);base64,(.+)$/);
            if (dataUrlMatch) {
                const mimeType = dataUrlMatch[1];
                const base64Data = dataUrlMatch[2];
                imageElements.push({
                    name: el.name || `Image ${imageElements.length + 1}`,
                    data: base64Data,
                    mimeType,
                });
            } else if (el.url.startsWith("http")) {
                // For external URLs, just note them (can't fetch server-side easily)
                textDescriptions.push(`[EXTERNAL IMAGE: ${el.name || "Unnamed"} - ${el.url}]`);
            }
        } else if (el.type === "note" && el.text) {
            textDescriptions.push(`[NOTE: "${el.text}"]`);
        } else if (el.type === "color" && el.color) {
            textDescriptions.push(`[COLOR SWATCH: ${el.color}]`);
        }
    }

    // DEBUG: Log extraction results
    console.log(`[analyzeCanvasForConstitution] Extracted: ${imageElements.length} images, ${textDescriptions.length} text elements`);
    if (imageElements.length > 0) {
        console.log(`  First image MIME: ${imageElements[0].mimeType}, data length: ${imageElements[0].data.length}`);
    }

    // Build the analysis prompt with explicit schema structure
    const analysisPrompt = `You are an expert Brand Constitution Architect analyzing a moodboard.

TASK: Analyze the ${imageElements.length} image(s) provided and extract the brand's visual DNA.

${textDescriptions.length > 0 ? `ADDITIONAL CONTEXT:\n${textDescriptions.join("\n")}` : ""}

CRITICAL REQUIREMENTS:
1. **Color Palette**: Extract the EXACT dominant colors from the images. Look at the actual pixels. For vintage propaganda, expect reds (#CC0000), golds (#D4AF37), blacks (#000000), creams (#F5F5DC), etc.
2. **Photography Style**: Describe the SPECIFIC visual style you see (not generic). Example: "Soviet Constructivist aesthetic with bold geometric shapes, high contrast, heroic perspective angles, limited color palette of red, gold, and black"
3. **Voice & Tone**: Infer the brand voice from the visual messaging. Propaganda = bold, commanding, inspirational.
4. **Keywords**: Extract actual themes you see in the imagery.
5. **Forbidden Elements**: Identify what would break this brand's visual identity.

You MUST respond with this EXACT JSON structure:
{
  "visual_identity": {
    "color_palette_hex": ["#XXXXXX", "#XXXXXX", ...],
    "photography_style": "detailed 50+ word description...",
    "forbidden_elements": ["element1", "element2", ...]
  },
  "voice": {
    "tone": "detailed 50+ word description...",
    "keywords": ["keyword1", "keyword2", ...]
  },
  "risk_thresholds": {
    "nudity": "STRICT_ZERO_TOLERANCE" or "ALLOW_ARTISTIC",
    "political": "STRICT_ZERO_TOLERANCE" or "ALLOW_SATIRE"
  }
}

BE SPECIFIC AND DETAILED. Do NOT return generic defaults. Analyze what you actually SEE.`;

    // Add text prompt first
    contentParts.push({ text: analysisPrompt });

    // Add each image as inline data (up to 10 images for reasonable processing)
    const maxImages = Math.min(imageElements.length, 10);
    for (let i = 0; i < maxImages; i++) {
        const img = imageElements[i];
        contentParts.push({
            inlineData: {
                mimeType: img.mimeType,
                data: img.data,
            },
        });
        // Add image label for context
        contentParts.push({ text: `[Image ${i + 1}: ${img.name}]` });
    }

    // If no images were extracted, add a warning to the prompt
    if (imageElements.length === 0) {
        contentParts.push({
            text: "\n\nWARNING: No valid images were provided. Generate a reasonable default constitution based on any color/note context provided."
        });
    }

    console.log(`Analyzing canvas with ${imageElements.length} images...`);

    const result = await model.generateContent(contentParts);
    const responseText = result.response.text();

    // Balanced brace extraction to handle cases where the model returns extra text
    let braceCount = 0;
    let startIndex = responseText.indexOf('{');
    let jsonStr = "";

    // DEBUG: Log raw response
    console.log(`[Gemini Response] Length: ${responseText.length}, First 500 chars:`);
    console.log(responseText.slice(0, 500));

    if (startIndex !== -1) {
        for (let i = startIndex; i < responseText.length; i++) {
            if (responseText[i] === '{') braceCount++;
            else if (responseText[i] === '}') braceCount--;

            if (braceCount === 0) {
                jsonStr = responseText.substring(startIndex, i + 1);
                break;
            }
        }
    }

    console.log(`[JSON Extraction] Found JSON: ${jsonStr.length > 0 ? 'YES' : 'NO'}, Length: ${jsonStr.length}`);

    if (jsonStr) {
        try {
            const parsed = JSON.parse(jsonStr);
            console.log(`[JSON Parse] SUCCESS - Keys: ${Object.keys(parsed).join(', ')}`);
            const result = validateAndSanitizeConstitution(parsed);
            console.log(`[Constitution] Colors: ${result.visual_identity.color_palette_hex.join(', ')}`);
            return result;
        } catch (err) {
            console.error(`[JSON Parse] FAILED:`, err);
            console.log(`[JSON String] First 200 chars: ${jsonStr.slice(0, 200)}`);
            // Fall through to default
        }
    } else {
        console.log(`[JSON Extraction] NO JSON FOUND in response`);
    }

    console.log(`[Constitution] Returning DEFAULT constitution`);
    return getDefaultConstitution();
}

/**
 * Ensures the AI output matches the expected structure, providing defaults for missing fields.
 * Handles BOTH Gemini's flat format AND our expected nested format.
 */
function validateAndSanitizeConstitution(data: any): BrandConstitution {
    const defaultConst = getDefaultConstitution();

    // Handle color palette - Gemini sometimes returns visual_identity as an array directly
    let colorPalette: string[];
    if (Array.isArray(data.visual_identity)) {
        // Gemini flat format: visual_identity is array of colors
        colorPalette = data.visual_identity;
    } else if (Array.isArray(data.visual_identity?.color_palette_hex)) {
        // Expected nested format
        colorPalette = data.visual_identity.color_palette_hex;
    } else if (Array.isArray(data.color_palette)) {
        // Alternative flat format
        colorPalette = data.color_palette;
    } else if (Array.isArray(data.color_palette_hex)) {
        // Another alternative
        colorPalette = data.color_palette_hex;
    } else {
        colorPalette = defaultConst.visual_identity.color_palette_hex;
    }

    // Handle photography style - can be at root or nested
    const photographyStyle =
        data.visual_identity?.photography_style ||
        data.photography_style ||
        defaultConst.visual_identity.photography_style;

    // Handle forbidden elements - can be at root or nested
    let forbiddenElements: string[];
    if (Array.isArray(data.visual_identity?.forbidden_elements)) {
        forbiddenElements = data.visual_identity.forbidden_elements;
    } else if (Array.isArray(data.forbidden_elements)) {
        forbiddenElements = data.forbidden_elements;
    } else {
        forbiddenElements = defaultConst.visual_identity.forbidden_elements;
    }

    // Handle voice tone - can be nested object or flat
    let voiceTone: string;
    if (typeof data.voice?.tone === 'string') {
        voiceTone = data.voice.tone;
    } else if (typeof data.voice === 'string') {
        voiceTone = data.voice;
    } else if (typeof data.voice_tone === 'string') {
        voiceTone = data.voice_tone;
    } else if (typeof data.tone === 'string') {
        voiceTone = data.tone;
    } else {
        voiceTone = defaultConst.voice.tone;
    }

    // Handle keywords - can be nested or at root
    let keywords: string[];
    if (Array.isArray(data.voice?.keywords)) {
        keywords = data.voice.keywords;
    } else if (Array.isArray(data.keywords)) {
        keywords = data.keywords;
    } else {
        keywords = defaultConst.voice.keywords;
    }

    // Handle risk thresholds
    const nudity = data.risk_thresholds?.nudity ||
        (data.risk_thresholds && typeof data.risk_thresholds === 'string' ? 'STRICT_ZERO_TOLERANCE' : defaultConst.risk_thresholds.nudity);
    const political = data.risk_thresholds?.political || defaultConst.risk_thresholds.political;

    console.log(`[validateAndSanitize] Extracted ${colorPalette.length} colors: ${colorPalette.slice(0, 3).join(', ')}...`);

    return {
        visual_identity: {
            color_palette_hex: colorPalette,
            photography_style: photographyStyle,
            forbidden_elements: forbiddenElements,
        },
        voice: {
            tone: voiceTone,
            keywords: keywords,
        },
        risk_thresholds: {
            nudity: nudity as "STRICT_ZERO_TOLERANCE" | "ALLOW_ARTISTIC",
            political: political as "STRICT_ZERO_TOLERANCE" | "ALLOW_SATIRE",
        },
    };
}

// ============ COMPLIANCE AUDIT ============

/**
 * Audit an image against brand constitution
 * NOTE: responseSchema + thinkingConfig removed - they conflict with multimodal content
 */
export async function auditImageCompliance(
    imageBase64: string,
    constitution: BrandConstitution
): Promise<AuditResult> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: {
            responseMimeType: "application/json",
            // responseSchema removed - conflicts with multimodal content
            temperature: 1.0,
        },
    }, { timeout: 45000 }); // 45s max for audit

    const imagePart: Part = {
        inlineData: {
            mimeType: "image/png",
            // Strip data:image/png;base64, prefix if present
            data: imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64,
        },
    };

    const prompt = `You are the Brand Compliance Auditor.
Audit this generated image against the following Brand Constitution:
${JSON.stringify(constitution, null, 2)}

REQUIREMENTS:
1. Provide a compliance score (0-100).
2. Pass is true if score >= 90.
3. Include heatmap coordinates for any issues.
4. Provide clear fix instructions.

You MUST respond with this EXACT JSON structure:
{
  "compliance_score": <number 0-100>,
  "pass": <boolean>,
  "heatmap_coordinates": [
    {"x": <number 0-100>, "y": <number 0-100>, "issue": "<description>"}
  ],
  "fix_instructions": "<detailed instructions>"
}

OUTPUT ONLY VALID JSON.`;

    try {
        const result = await model.generateContent([prompt, imagePart], { timeout: 600000 });
        const responseText = result.response.text();

        // Balanced brace extraction to handle cases where the model returns extra text
        let braceCount = 0;
        let startIndex = responseText.indexOf('{');
        let jsonStr = "";

        if (startIndex !== -1) {
            for (let i = startIndex; i < responseText.length; i++) {
                if (responseText[i] === '{') braceCount++;
                else if (responseText[i] === '}') braceCount--;

                if (braceCount === 0) {
                    jsonStr = responseText.substring(startIndex, i + 1);
                    break;
                }
            }
        }

        if (jsonStr) {
            const parsed = JSON.parse(jsonStr);
            // Flexible validation - handle various response formats
            return validateAndSanitizeAuditResult(parsed);
        }

        throw new Error("No valid JSON object found in response");
    } catch (error) {
        console.error("Audit error:", error);
        return {
            compliance_score: 50,
            pass: false,
            heatmap_coordinates: [],
            fix_instructions: "Unable to complete audit due to technical error.",
        };
    }
}

/**
 * Ensures audit result matches expected structure, handling various Gemini response formats
 */
function validateAndSanitizeAuditResult(data: any): AuditResult {
    // Handle compliance_score - can be at root or nested
    const score = typeof data.compliance_score === 'number' ? data.compliance_score :
        typeof data.score === 'number' ? data.score : 50;

    // Handle pass - can be boolean or string
    const pass = typeof data.pass === 'boolean' ? data.pass :
        data.pass === 'true' ? true :
            score >= 90;

    // Handle heatmap_coordinates - can be at root or nested
    const coords = Array.isArray(data.heatmap_coordinates) ? data.heatmap_coordinates :
        Array.isArray(data.coordinates) ? data.coordinates :
            Array.isArray(data.issues) ? data.issues.map((issue: any, i: number) => ({
                x: issue.x || (i * 20) % 100,
                y: issue.y || (i * 20) % 100,
                issue: issue.issue || issue.description || String(issue)
            })) : [];

    // Handle fix_instructions - can be string or array
    const fixInstructions = typeof data.fix_instructions === 'string' ? data.fix_instructions :
        typeof data.instructions === 'string' ? data.instructions :
            Array.isArray(data.fix_instructions) ? data.fix_instructions.join('. ') :
                "No specific fix instructions provided.";

    return {
        compliance_score: Math.max(0, Math.min(100, score)),
        pass,
        heatmap_coordinates: coords,
        fix_instructions: fixInstructions,
    };
}

// ============ PROMPT REFINEMENT ============

/**
 * Refine a prompt based on audit feedback
 */
export async function refinePromptBasedOnFeedback(
    originalPrompt: string,
    feedback: string,
    issues?: string[]
): Promise<string> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: {
            // @ts-expect-error - thinking config is valid in Gemini 3
            thinkingConfig: {
                thinkingLevel: getThinkingLevel("refine_prompt"),
            },
            temperature: 1.0,
        }
    }, { timeout: 30000 }); // 30s max for refinement

    const prompt = `You are a prompt engineer.

ORIGINAL PROMPT: "${originalPrompt}"

AUDIT FEEDBACK: ${feedback}
${issues ? `SPECIFIC ISSUES: ${issues.join(", ")}` : ""}

Rewrite the prompt to fix these issues. Output ONLY the refined prompt, nothing else.`;

    const result = await model.generateContent(prompt, { timeout: 600000 });
    return result.response.text().trim();
}

// ============ FUNCTION CALLING AGENT ============

/**
 * Run the agent loop with function calling
 * This is the core agentic behavior - AI decides what to do
 */
export async function runAgentLoop(
    userPrompt: string,
    canvasElements: CanvasElement[],
    onAction: (action: AgentAction) => void,
    savedConstitution?: BrandConstitution | null
): Promise<{ success: boolean; image?: string; message: string; history: AgentAction[]; constitution?: BrandConstitution }> {
    const client = getGeminiClient();

    // Convert our tools to Gemini's function declaration format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const functionDeclarations: FunctionDeclaration[] = AGENT_TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters as unknown as FunctionDeclaration["parameters"],
    }));

    const model = client.getGenerativeModel({
        model: "gemini-3-flash-preview",
        tools: [{ functionDeclarations }],
        toolConfig: {
            functionCallingConfig: {
                mode: FunctionCallingMode.AUTO,
            },
        },
        generationConfig: {
            // @ts-expect-error - thinking config for agent loop
            thinkingConfig: {
                includeThoughts: true,
                thinkingLevel: getThinkingLevel("agent_loop"), // Dynamic - uses "medium"
            },
            temperature: 1.0,
        },
    }, { timeout: 60000 }); // 60s per call for faster feedback

    // Initialize agent state with memory and original canvas elements
    let state: AgentState = {
        step: 0,
        phase: "planning",
        constitution: savedConstitution || null,
        currentImage: null,
        auditScore: null,
        attempts: 0,
        maxAttempts: 3,
        history: [],
        canvasElements, // Store original elements with actual image data
    };

    // Build the initial prompt with memory context
    const memoryContext = savedConstitution
        ? `\n\nMEMORY: You have a saved Brand Constitution from a previous session:\n${JSON.stringify(savedConstitution, null, 2)}\nYou may skip analyze_canvas if this constitution is still relevant.`
        : "";

    const systemMessage = `You are an autonomous marketing asset generator agent.

USER REQUEST: "${userPrompt}"

AVAILABLE CANVAS ELEMENTS (LONG CONTEXT):
${JSON.stringify(canvasElements, null, 2)}
${memoryContext}

YOUR GOAL:
1. First, call analyze_canvas to understand the brand (OR use saved constitution if available)
2. Optionally call search_trends for current design trends
3. Then, call generate_image with a prompt based on the brand constitution
4. Call audit_compliance to check the generated image
5. If audit fails (score < 90), call refine_prompt and generate_image again
6. Maximum 3 attempts. After that, complete with best result.
7. When done, call complete_task

Think step by step. Execute one action at a time.
Explain your reasoning before each action.`;

    const chat = model.startChat();

    // Initial message with retry for robustness
    let response;
    let initialRetry = 0;
    while (initialRetry <= 2) {
        try {
            response = await chat.sendMessage(systemMessage, { timeout: 60000 });
            break;
        } catch (error) {
            initialRetry++;
            if (initialRetry > 2) throw new Error(`Agent initialization failed after 3 attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.warn(`Agent init failed, retrying (${initialRetry}/2)...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * initialRetry));
        }
    }

    // Agent loop - reduced iterations for faster completion
    const maxIterations = 8; // Reduced from 12 - most succeed by step 6

    // response is guaranteed to be defined here since we throw in the retry loop if all attempts fail
    for (let i = 0; i < maxIterations; i++) {
        const candidate = response!.response.candidates?.[0];
        if (!candidate) break;

        // Check for function calls
        const functionCalls = candidate.content.parts
            .filter((part) => part.functionCall)
            .map((part) => part.functionCall!);

        // Extract thoughts from the model (Gemini 3 native thinking feature)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const thoughts = candidate.content.parts
            .map((part: unknown) => (part as { thought?: string }).thought)
            .filter(Boolean)
            .join("\n");

        if (functionCalls.length === 0) {
            // No function call, agent is done or stuck
            break;
        }

        // Execute each function call
        const functionResponses: Part[] = [];

        for (const fc of functionCalls) {
            state.step++;

            // Execute the tool
            const { result, state: newState } = await executeTool(
                fc.name,
                fc.args as Record<string, unknown>,
                state
            );
            state = newState;

            // Log the action with thinking
            const action: AgentAction = {
                timestamp: Date.now(),
                tool: fc.name,
                input: fc.args as Record<string, unknown>,
                output: result,
                thinking: thoughts || undefined,
            };
            state.history.push(action);
            onAction(action);

            // Build function response
            functionResponses.push({
                functionResponse: {
                    name: fc.name,
                    response: result as object,
                },
            });

            // Check if we're done
            if (fc.name === "complete_task") {
                const completionResult = result as { success: boolean; message: string; final_image?: string };
                return {
                    success: completionResult.success,
                    image: completionResult.final_image || state.currentImage || undefined,
                    message: completionResult.message,
                    history: state.history,
                    constitution: state.constitution || undefined,
                };
            }
        }

        // Send function results back to model with retry for robustness
        let retryCount = 0;
        const maxRetries = 2;
        while (retryCount <= maxRetries) {
            try {
                response = await chat.sendMessage(functionResponses, { timeout: 60000 }); // 60s per call
                break; // Success
            } catch (error) {
                retryCount++;
                if (retryCount > maxRetries) throw error;
                console.warn(`Agent fetch failed, retrying (${retryCount}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            }
        }
    }

    // If we get here, agent didn't complete properly
    return {
        success: state.currentImage !== null,
        image: state.currentImage || undefined,
        message: `Agent completed after ${state.attempts} attempts. Best score: ${state.auditScore || "N/A"}`,
        history: state.history,
        constitution: state.constitution || undefined,
    };
}

// ============ HELPERS ============

function getDefaultConstitution(): BrandConstitution {
    return {
        visual_identity: {
            color_palette_hex: ["#00FFCC", "#FF00FF", "#000000"],
            photography_style: "Modern, bold, high contrast",
            forbidden_elements: [],
        },
        voice: {
            tone: "Professional yet approachable",
            keywords: ["Innovation", "Quality"],
        },
        risk_thresholds: {
            nudity: "STRICT_ZERO_TOLERANCE",
            political: "STRICT_ZERO_TOLERANCE",
        },
    };
}

// Re-export legacy functions for backward compatibility
export { analyzeCanvasForConstitution as analyzeAndGenerateConstitution };
export { auditImageCompliance as auditAsset };

export function buildEnhancedPrompt(
    userPrompt: string,
    constitution: BrandConstitution
): string {
    const { visual_identity, voice } = constitution;
    return `${userPrompt}

STYLE: ${visual_identity.photography_style}
COLORS: ${visual_identity.color_palette_hex.join(", ")}
TONE: ${voice.tone}
FORBIDDEN: ${visual_identity.forbidden_elements.join(", ") || "None"}`;
}
