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
        // Agent orchestration - speed priority, decisions are straightforward
        case "agent_loop":
            return "low";
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

/**
 * Summarize function response for Gemini - strip large base64 data
 * The model doesn't need the actual image bytes, just success/failure info
 */
function summarizeFunctionResponse(toolName: string, result: object): object {
    const obj = result as Record<string, unknown>;

    switch (toolName) {
        case "generate_image":
            // Don't send image data back - just success status
            return {
                success: obj.success,
                image_generated: obj.image_generated || obj.success,
                error: obj.error,
            };
        case "audit_compliance":
            // Keep audit results but strip any image data
            return {
                compliance_score: obj.compliance_score,
                pass: obj.pass,
                fix_instructions: obj.fix_instructions,
                issue_count: Array.isArray(obj.heatmap_coordinates) ? obj.heatmap_coordinates.length : 0,
            };
        case "analyze_canvas":
            // Keep constitution but it's already small
            return result;
        case "complete_task":
            // Strip final_image from response
            return {
                success: obj.success,
                message: obj.message,
            };
        default:
            // For other tools, return as-is
            return result;
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
            const passes = auditResult.pass || auditResult.compliance_score >= 90;

            // If audit passes, signal that we should auto-complete
            return {
                result: {
                    success: true,
                    compliance_score: auditResult.compliance_score,
                    pass: passes,
                    issues: (auditResult.heatmap_coordinates || []).map((h) => h.issue),
                    fix_instructions: auditResult.fix_instructions,
                    // Signal to agent: if pass is true, call complete_task immediately
                    next_action: passes ? "CALL complete_task NOW - image passed audit!" : "refine and retry",
                },
                state: {
                    ...state,
                    auditScore: auditResult.compliance_score,
                    phase: passes ? "complete" : "auditing",
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
            // Debug log what the model passed
            console.log(`[complete_task] args.final_image_base64 type=${typeof args.final_image_base64}, length=${(args.final_image_base64 as string)?.length || 0}`);
            console.log(`[complete_task] state.currentImage length=${state.currentImage?.length || 0}`);

            // ALWAYS use state.currentImage - the model sometimes passes placeholder text like "input_file_1.png"
            const finalImage = state.currentImage || null;
            console.log(`[complete_task] Using finalImage length=${finalImage?.length || 0}`);

            return {
                result: {
                    success: args.success,
                    message: args.message,
                    final_image: finalImage,
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

        // Debug logging
        console.log(`[NanoBanana] Response has ${parts.length} parts`);
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part.inlineData) {
                console.log(`[NanoBanana] Part ${i}: inlineData mimeType=${part.inlineData.mimeType}, dataLength=${part.inlineData.data?.length || 0}`);
            } else if (part.text) {
                console.log(`[NanoBanana] Part ${i}: text (${part.text.length} chars)`);
            } else {
                console.log(`[NanoBanana] Part ${i}: unknown type`, Object.keys(part));
            }
        }

        for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
                const base64Data = part.inlineData.data;
                if (base64Data && base64Data.length > 100) {
                    console.log(`[NanoBanana] SUCCESS: Returning image data (${base64Data.length} chars)`);
                    return base64Data; // Base64 encoded image
                }
            }
        }

        // If we got here, no valid image in response - log the full parts for debugging
        console.error("[NanoBanana] No valid image in response. Parts:", JSON.stringify(parts.map(p => ({
            hasInlineData: !!p.inlineData,
            inlineDataMime: p.inlineData?.mimeType,
            textLength: p.text?.length,
        }))));
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
            // @ts-expect-error - thinking config for Gemini 3 (docs only show includeThoughts, not thinkingLevel)
            thinkingConfig: {
                includeThoughts: true,
            },
            temperature: 1.0,
        },
    }, { timeout: 120000 }); // 120s per call (image generation can take 30-60s)

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

    // Create a lightweight summary of canvas elements (NO base64 data - that causes timeouts!)
    const elementsSummary = canvasElements.map(el => ({
        id: el.id,
        type: el.type,
        name: el.name || `${el.type} element`,
        // For images, just note that it exists - actual data is passed to analyze_canvas
        hasImage: el.type === 'image' && !!el.url,
        // For notes and colors, include the actual values
        text: el.type === 'note' ? el.text : undefined,
        color: el.type === 'color' ? el.color : undefined,
    }));

    const systemMessage = `You are an autonomous marketing asset generator agent.

USER REQUEST: "${userPrompt}"

CANVAS ELEMENTS AVAILABLE (${canvasElements.length} items):
${JSON.stringify(elementsSummary, null, 2)}

NOTE: Image data is stored separately and will be analyzed when you call analyze_canvas.
${memoryContext}

YOUR GOAL:
${savedConstitution ? `IMPORTANT: You already have a SAVED Brand Constitution (shown above in MEMORY). SKIP analyze_canvas and proceed directly to step 3.` : `1. First, call analyze_canvas to understand the brand from the moodboard images.`}
2. Optionally call search_trends for current design trends (recommended for better results).
3. Call generate_image with a detailed prompt based on the brand constitution.
4. Call audit_compliance to check the generated image against brand guidelines.
5. If audit fails (score < 90), call refine_prompt and generate_image again.
6. Maximum 3 attempts. After that, complete with best result.
7. When done, call complete_task.

Think step by step. Execute one action at a time.
Explain your reasoning before each action.`;

    // Debug: Log system message size to diagnose bad request issues
    console.log(`[Agent Init] System message size: ${systemMessage.length} chars`);
    console.log(`[Agent Init] Elements summary: ${JSON.stringify(elementsSummary).length} chars for ${canvasElements.length} elements`);
    if (savedConstitution) {
        console.log(`[Agent Init] Constitution size: ${JSON.stringify(savedConstitution).length} chars`);
    }

    const chat = model.startChat();

    // Initial message with exponential backoff and jitter for robustness
    let response;
    let initialRetry = 0;
    const maxInitRetries = 3;

    while (initialRetry <= maxInitRetries) {
        try {
            console.log(`[Agent Init] Attempt ${initialRetry + 1}/${maxInitRetries + 1}...`);
            response = await chat.sendMessage(systemMessage, { timeout: 90000 }); // 90s for init
            console.log(`[Agent Init] Success on attempt ${initialRetry + 1}`);
            break;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const is500Error = errorMsg.includes("500") || errorMsg.includes("Internal");
            const isTimeout = errorMsg.includes("aborted") || errorMsg.includes("timeout");

            initialRetry++;
            console.error(`[Agent Init] Attempt ${initialRetry} failed: ${errorMsg}`);

            if (initialRetry > maxInitRetries) {
                // Final failure - provide actionable error message
                if (is500Error) {
                    throw new Error(`Gemini API server error (500). The AI service is experiencing issues. Please try again in a few seconds.`);
                } else if (isTimeout) {
                    throw new Error(`Request timeout. The AI service is slow. Please try again.`);
                } else {
                    throw new Error(`Agent initialization failed: ${errorMsg}`);
                }
            }

            // Exponential backoff with jitter (2s, 4s, 8s base + random 0-1s)
            const backoffMs = Math.pow(2, initialRetry) * 1000 + Math.random() * 1000;
            console.log(`[Agent Init] Retrying in ${Math.round(backoffMs)}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
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

            // Build function response - SUMMARIZE to avoid sending large base64 data back to Gemini
            // The model only needs to know success/failure, not the actual image bytes
            const summarizedResult = summarizeFunctionResponse(fc.name, result as object);
            functionResponses.push({
                functionResponse: {
                    name: fc.name,
                    response: summarizedResult,
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

        // Send function results back to model
        // IMPORTANT: Using original chat.sendMessage() to preserve thought_signature
        // Gemini 3 with thinkingConfig requires thought signatures in function call history
        // Fresh chat approach breaks this - signatures must be preserved across turns
        let retryCount = 0;
        const maxRetries = 2;
        let apiCallSucceeded = false;

        while (retryCount <= maxRetries) {
            try {
                // Debug: log payload size to diagnose timeouts
                const payloadSize = JSON.stringify(functionResponses).length;
                console.log(`[Agent Loop] Sending ${functionResponses.length} responses, payload size: ${payloadSize} bytes, step: ${state.step}`);

                // Use the original chat which preserves thought_signature in history
                response = await chat.sendMessage(functionResponses, { timeout: 120000 }); // 120s timeout for accumulated history
                apiCallSucceeded = true;
                break; // Success
            } catch (error) {
                retryCount++;
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.warn(`Agent API call failed (${retryCount}/${maxRetries}): ${errorMsg}`);

                if (retryCount > maxRetries) {
                    // GRACEFUL DEGRADATION: If we have an image, return it instead of failing
                    if (state.currentImage && state.currentImage.length > 1000) {
                        console.log(`[Graceful Degradation] Returning image despite API failure. Image size: ${state.currentImage.length}`);
                        return {
                            success: true,
                            image: state.currentImage,
                            message: `Generated image successfully! (Agent flow interrupted but image was created)`,
                            history: state.history,
                            constitution: state.constitution || undefined,
                        };
                    }
                    // No image available, rethrow the error
                    throw error;
                }
                // Exponential backoff with jitter (2s, 4s base + random 0-1s)
                const backoffMs = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
                console.log(`[Agent Loop] Retrying in ${Math.round(backoffMs)}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
        }

        // If API call failed but we didn't return/throw, something is wrong - safeguard
        if (!apiCallSucceeded && state.currentImage) {
            console.log(`[Safeguard] API call failed but image exists. Returning image.`);
            return {
                success: true,
                image: state.currentImage,
                message: `Image generated successfully!`,
                history: state.history,
                constitution: state.constitution || undefined,
            };
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
