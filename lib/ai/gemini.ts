import {
    GoogleGenerativeAI,
    FunctionCallingMode,
    type FunctionDeclaration,
    type Part,
} from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import path from "path";
import os from "os";
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

function getFileManager(): GoogleAIFileManager {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    return new GoogleAIFileManager(apiKey);
}

/**
 * Upload an image to Gemini Files API for visual grounding
 * Returns the file URI for use in model history
 */
async function uploadToFilesAPI(base64Data: string, displayName: string): Promise<string> {
    const fileManager = getFileManager();
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `gemini_upload_${Date.now()}.png`);

    try {
        // Strip prefix if present
        const data = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
        fs.writeFileSync(tempPath, Buffer.from(data, 'base64'));

        console.log(`[Files API] Uploading ${displayName}...`);
        const uploadResult = await fileManager.uploadFile(tempPath, {
            mimeType: "image/png",
            displayName,
        });

        console.log(`[Files API] Uploaded: ${uploadResult.file.uri}`);
        return uploadResult.file.uri;
    } catch (error) {
        console.error("[Files API] Upload failed:", error);
        throw error;
    } finally {
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
}

// ============ THINKING MODE ============

type ThinkingLevel = "minimal" | "low" | "medium" | "high";

function getThinkingLevel(operation: string): ThinkingLevel {
    switch (operation) {
        case "analyze_canvas": return "high";
        case "audit_compliance": return "medium";
        case "agent_loop": return "low";
        case "generate_image":
        case "search_trends":
        case "refine_prompt":
        default: return "low";
    }
}

// ============ GOOGLE SEARCH GROUNDING ============

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
 */
function summarizeFunctionResponse(toolName: string, result: object): object {
    const obj = result as Record<string, unknown>;
    switch (toolName) {
        case "generate_image":
            return {
                success: obj.success,
                image_generated: obj.image_generated || obj.success,
                file_uri: obj.file_uri, // PASS THROUGH URI
                error: obj.error
            };
        case "audit_compliance":
            return { compliance_score: obj.compliance_score, pass: obj.pass, fix_instructions: obj.fix_instructions };
        case "analyze_canvas":
            return result;
        case "complete_task":
            return { success: obj.success, message: obj.message };
        default:
            return result;
    }
}

// ============ TOOL EXECUTION ============

export async function executeTool(
    toolName: string,
    args: Record<string, unknown>,
    state: AgentState
): Promise<{ result: unknown; state: AgentState }> {
    switch (toolName) {
        case "analyze_canvas": {
            const elements = state.canvasElements || [];
            if (elements.length === 0) {
                return { result: { success: false, error: "No canvas elements found in state" }, state };
            }
            const constitution = await analyzeCanvasForConstitution(elements);
            return {
                result: { success: true, constitution },
                state: { ...state, constitution, phase: "analyzing" },
            };
        }

        case "generate_image": {
            const prompt = args.prompt as string;
            // FORCE CONSTITUTION: If agent forgets, inject from state
            const styleGuide = (args.style_guide as string) || state.constitution?.visual_identity?.style_description;
            const colorPalette = (args.color_palette as string[]) || state.constitution?.visual_identity?.color_palette_hex;
            const forbidden = (args.forbidden_elements as string[]) || state.constitution?.visual_identity?.forbidden_elements;

            const aspectRatio = args.aspect_ratio as ImageConfig["aspectRatio"] | undefined;
            const imageSize = args.image_size as ImageConfig["imageSize"] | undefined;

            let imageBase64: string | null = null;
            let lastError: Error | null = null;
            const maxImageRetries = 1; // OPTIMIZATION: Fail fast

            for (let attempt = 1; attempt <= maxImageRetries; attempt++) {
                try {
                    imageBase64 = await generateImageWithNanoBanana(prompt, {
                        styleGuide,
                        colorPalette,
                        forbiddenElements: forbidden,
                        aspectRatio,
                        imageSize,
                    });
                    break;
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    // No retry delay needed for single attempt
                }
            }

            if (!imageBase64) {
                return {
                    result: { success: false, error: `Failed: ${lastError?.message || 'Unknown error'}` },
                    state: { ...state, phase: "generating", attempts: state.attempts + 1 },
                };
            }

            return {
                result: { success: true, image_generated: true },
                state: { ...state, currentImage: imageBase64, phase: "generating", attempts: state.attempts + 1 },
            };
        }

        case "audit_compliance": {
            const imageBase64 = state.currentImage;
            const constitution = state.constitution;

            if (!imageBase64 || !constitution) {
                return { result: { success: false, error: "Missing image or brand DNA." }, state };
            }

            const auditResult = await auditImageCompliance(imageBase64, constitution);
            const passes = auditResult.pass || auditResult.compliance_score >= 90;

            return {
                result: {
                    success: true,
                    compliance_score: auditResult.compliance_score,
                    pass: passes,
                    issues: (auditResult.heatmap_coordinates || []).map((h) => h.issue),
                    fix_instructions: auditResult.fix_instructions,
                },
                state: { ...state, auditScore: auditResult.compliance_score, phase: passes ? "complete" : "auditing" },
            };
        }

        case "refine_prompt": {
            const originalPrompt = args.original_prompt as string;
            const feedback = args.audit_feedback as string;
            const issues = args.issues as string[] | undefined;
            const refinedPrompt = await refinePromptBasedOnFeedback(originalPrompt, feedback, issues);
            return {
                result: { success: true, refined_prompt: refinedPrompt },
                state: { ...state, phase: "refining" },
            };
        }

        case "search_trends": {
            const query = args.query as string;
            const searchResults = await searchWebForContext(query);
            return { result: { success: true, search_results: searchResults }, state };
        }

        case "complete_task": {
            return {
                result: { success: args.success, message: args.message, final_image: state.currentImage },
                state: { ...state, phase: "complete" },
            };
        }

        default:
            return { result: { error: `Unknown tool: ${toolName}` }, state };
    }
}

// ============ IMAGE GENERATION ============

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
    const { styleGuide, colorPalette, forbiddenElements, aspectRatio = "1:1", imageSize = "2K" } = options || {};

    let enhancedPrompt = prompt;
    if (styleGuide) enhancedPrompt += `\nSTYLE GUIDE: ${styleGuide}`;
    if (colorPalette?.length) enhancedPrompt += `\nCOLORS: ${colorPalette.join(", ")}`;
    if (forbiddenElements?.length) enhancedPrompt += `\nFORBIDDEN: ${forbiddenElements.join(", ")}`;
    enhancedPrompt += `\nRESOLUTION: ${imageSize}`;

    const model = client.getGenerativeModel({
        model: "gemini-3-pro-image-preview",
        generationConfig: {
            // @ts-expect-error - modalities
            responseModalities: ["image", "text"],
            imageConfig: { aspectRatio },
            temperature: 1.0,
        },
    });

    try {
        const response = await model.generateContent(enhancedPrompt, { timeout: 120000 }); // REDUCED TIMEOUT
        const parts = response.response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
                return part.inlineData.data;
            }
        }
        throw new Error("No image generated");
    } catch (error) {
        console.error("Nano Banana generation error:", error);
        throw error;
    }
}

// ============ UTILS ============

/**
 * Robustly extracts the first valid JSON object from a string
 * Handles properties, nested objects, and arrays.
 */
function extractFirstJson(text: string): any {
    try {
        // First try standard regex for clean JSON blocks
        const jsonBlock = text.match(/```json\n([\s\S]*?)\n```/)?.[1];
        if (jsonBlock) return JSON.parse(jsonBlock);

        // If no block, try finding the first { and matching }
        const start = text.indexOf('{');
        if (start === -1) return null;

        let braceCount = 0;
        let inString = false;
        let escape = false;
        let end = -1;

        for (let i = start; i < text.length; i++) {
            const char = text[i];

            if (inString) {
                if (escape) {
                    escape = false;
                } else if (char === '\\') {
                    escape = true;
                } else if (char === '"') {
                    inString = false;
                }
                continue;
            }

            if (char === '"') {
                inString = true;
                continue;
            }

            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    end = i + 1;
                    break;
                }
            }
        }

        if (end !== -1) {
            const jsonCandidate = text.substring(start, end);
            return JSON.parse(jsonCandidate);
        }
    } catch (e) {
        console.error("JSON extraction failed:", e);
    }
    return null;
}

// ============ CANVAS ANALYSIS ============

export async function analyzeCanvasForConstitution(elements: CanvasElement[]): Promise<BrandConstitution> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
        model: "gemini-3-pro-preview",
        generationConfig: {
            responseMimeType: "application/json",
            // @ts-expect-error - thinking config
            thinkingConfig: { includeThoughts: true, thinkingLevel: getThinkingLevel("analyze_canvas") },
            temperature: 1.0,
        },
    }, { timeout: 120000 });

    const imageElements = elements.filter(el => el.type === "image" && el.url?.startsWith("data:"));
    const textContext = elements.filter(el => el.type === "note").map(el => el.text).join("\n");

    const contentParts: Part[] = [{
        text: `Act as a World-Class Art Director and Brand Strategist.
Analyze the provided images and text to extract the unique "Visual DNA" and "Brand Constitution".

CRITICAL INSTRUCTIONS:
1. IGNORE generic terms like "clean", "modern", or "professional" unless the input is explicitly devoid of style.
2. Identify specific ART MOVEMENTS (e.g., Constructivism, Bauhaus, Synthwave, Soviet Propaganda), ERAS (e.g., 1950s, 1980s), and ATMOSPHERES (e.g., Gritty, Ethereal, Industrial).
3. If images are present, prioritize their visual cues over the text.
4. Extract a precise Color Palette (hex codes).
5. Define a "Style Description" that would allow a designer to recreate this exact vibe without seeing the original images.

Output MUST be valid JSON with this exact structure:
{
  "visual_identity": {
    "color_palette_hex": ["#FF0000", "#FFD700", "#000000"], // Example
    "photography_style": "High-contrast, grainy film look",
    "style_description": "Gritty Soviet Constructivism with bold geometric shapes",
    "forbidden_elements": ["Gradients", "Rounded corners"]
  },
  "voice": {
    "tone": "Authoritative",
    "keywords": ["Revolution", "Strength", "Solidarity"]
  },
  "risk_thresholds": {
    "nudity": "STRICT_ZERO_TOLERANCE",
    "political": "ALLOW_PROPAGANDA_STYLE"
  }
}

Context Notes: ${textContext}`
    }];

    for (const img of imageElements.slice(0, 5)) {
        const match = img.url!.match(/^data:([^;]+);base64,(.+)$/);
        if (match) contentParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
    }

    const result = await model.generateContent(contentParts);
    const text = result.response.text();
    console.log("[Constitution raw]:", text); // DEBUG RAW OUTPUT
    const json = extractFirstJson(text);

    if (json) {
        return validateAndSanitizeConstitution(json);
    }
    console.error("Failed to parse constitution from:", text);
    return getDefaultConstitution();
}

// ============ COMPLIANCE AUDIT ============

export async function auditImageCompliance(imageBase64: string, constitution: BrandConstitution): Promise<AuditResult> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: {
            responseMimeType: "application/json",
            // @ts-expect-error - thinking config
            thinkingConfig: { includeThoughts: true, thinkingLevel: getThinkingLevel("audit_compliance") },
            temperature: 1.0,
        },
    });

    const prompt = `Act as a Brand Compliance Auditor.
Compare the generated image against the Brand Constitution.

Brand Constitution:
${JSON.stringify(constitution, null, 2)}

CRITICAL INSTRUCTIONS:
1. Analyze the image for strict adherence to the Constitution's Color Palette, Photography Style, and Vibe.
2. Check for any Forbidden Elements.
3. Assign a "Compliance Score" (0-100).
4. GENERATE A VALID JSON RESPONSE.

Output MUST be valid JSON with this exact structure:
{
  "compliance_score": 85,
  "pass": true,
  "heatmap_coordinates": [], // Optional
  "fix_instructions": "Increase contrast to match 'Gritty' vibe."
}`;

    const imagePart: Part = {
        inlineData: {
            mimeType: "image/png",
            data: imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64,
        },
    };

    try {
        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();
        console.log("[Audit raw]:", text); // DEBUG RAW OUTPUT
        const json = extractFirstJson(text);

        if (json) return validateAndSanitizeAuditResult(json);
        throw new Error("No JSON in audit");
    } catch (error) {
        console.error("Audit error:", error);
        // Fallback for UI stability, but logged as error
        return { compliance_score: 50, pass: false, heatmap_coordinates: [], fix_instructions: "Audit service temporary unavailable." };
    }
}

// ============ AGENT LOOP ============

export async function runAgentLoop(
    userPrompt: string,
    canvasElements: CanvasElement[],
    onAction: (action: AgentAction) => void,
    savedConstitution?: BrandConstitution | null,
    previousActions?: AgentAction[]
): Promise<{ success: boolean; image?: string; message: string; history: AgentAction[]; constitution?: BrandConstitution }> {
    const client = getGeminiClient();
    const functionDeclarations: FunctionDeclaration[] = AGENT_TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters as unknown as FunctionDeclaration["parameters"],
    }));

    const canvasSummary = canvasElements
        .map(el => {
            if (el.type === 'image') return `[Image: ${el.id}]`;
            if (el.type === 'text') return `[Text: "${el.text}"]`;
            if (el.type === 'note') return `[Note: "${el.text}"]`;
            return `[${el.type}]`;
        })
        .join(", ");

    const systemMessage = `Autonomous agent. Goal: Generate asset matching brand.
USER: "${userPrompt}"
CANVAS CONTEXT: ${canvasSummary}
${savedConstitution ? "HAS CONSTITUTION IN MEMORY" : "CALL analyze_canvas FIRST"}`;

    const model = client.getGenerativeModel({
        model: "gemini-3-flash-preview",
        systemInstruction: systemMessage,
        tools: [{ functionDeclarations }],
        toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
        generationConfig: {
            // @ts-expect-error - thinking config
            thinkingConfig: { includeThoughts: true, thinkingLevel: getThinkingLevel("agent_loop") },
            temperature: 1.0,
        },
    }, { timeout: 300000 });

    let state: AgentState = {
        step: previousActions ? previousActions.length : 0,
        phase: "planning",
        constitution: savedConstitution || null,
        currentImage: null,
        auditScore: null,
        attempts: 0,
        maxAttempts: 3,
        history: previousActions || [],
        canvasElements,
    };

    const chat = model.startChat({
        history: previousActions ? previousActions.map(action => ({
            role: "user",
            parts: [{ text: "Resuming..." }]
        })) : []
    });

    let response;
    try {
        response = await chat.sendMessage(userPrompt, { timeout: 120000 });
    } catch (e) {
        throw e;
    }

    const maxIterations = 8;
    for (let i = 0; i < maxIterations; i++) {
        const candidate = response.response.candidates?.[0];
        if (!candidate) break;

        const functionCalls = candidate.content.parts.filter(p => p.functionCall).map(p => p.functionCall!);
        const thinking = candidate.content.parts.filter((p: any) => p.thought && p.text).map((p: any) => p.text).join("\n");
        const signature = (candidate.content.parts.find((p: any) => p.thoughtSignature) as any)?.thoughtSignature;

        if (functionCalls.length === 0) break;

        const functionResponses: Part[] = [];
        const results = await Promise.all(functionCalls.map(async (fc) => {
            state.step++;
            const { result, state: newState } = await executeTool(fc.name, fc.args as Record<string, unknown>, state);
            return { fc, result, newState };
        }));

        for (const { fc, result, newState } of results) {
            state = { ...state, ...newState, history: state.history };

            let fileUri: string | undefined;
            if (fc.name === "generate_image" && (result as any).success && state.currentImage) {
                try {
                    fileUri = await uploadToFilesAPI(state.currentImage, `gen_${Date.now()}.png`);
                    console.log(`[Grounding] ${fileUri}`);
                    // VISUAL GROUNDING: Store URI in result for functionResponse
                    (result as any).file_uri = fileUri;
                } catch (e) {
                    console.error("Upload failed", e);
                }
            }

            const action: AgentAction = {
                timestamp: Date.now(),
                tool: fc.name,
                input: fc.args as Record<string, unknown>,
                output: result,
                thinking: thinking || undefined,
                thoughtSignature: signature as string | undefined,
                fileUri,
            };
            state.history.push(action);
            onAction(action);

            functionResponses.push({
                functionResponse: {
                    name: fc.name,
                    response: summarizeFunctionResponse(fc.name, result as object)
                }
            } as any);

            if (fc.name === "complete_task") {
                const res = result as { success: boolean; message: string; final_image?: string };
                return {
                    success: res.success,
                    image: res.final_image || state.currentImage || undefined,
                    message: res.message,
                    history: state.history,
                    constitution: state.constitution || undefined
                };
            }
        }

        try {
            response = await chat.sendMessage(functionResponses, { timeout: 300000 });
        } catch (e) {
            if (state.currentImage) {
                return {
                    success: true,
                    image: state.currentImage,
                    message: "Partial success (Timeout during auditing).",
                    history: state.history,
                    constitution: state.constitution || undefined
                };
            }
            throw e;
        }
    }

    return {
        success: !!state.currentImage,
        image: state.currentImage || undefined,
        message: "Loop end.",
        history: state.history,
        constitution: state.constitution || undefined
    };
}

// ============ REFINEMENT ============

export async function refinePromptBasedOnFeedback(prompt: string, feedback: string, issues?: string[]): Promise<string> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: {
            // @ts-expect-error - thinking
            thinkingConfig: { thinkingLevel: "low" },
            temperature: 1.0,
        }
    });

    const res = await model.generateContent(`Refine prompt: ${prompt}\nFeedback: ${feedback}\nIssues: ${issues?.join(', ')}`);
    return res.response.text().trim();
}

// ============ SANITIZATION ============

function validateAndSanitizeConstitution(data: any): BrandConstitution {
    const def = getDefaultConstitution();

    // Helper to ensure array or default
    const asArray = (val: any, defaultVal: string[]) => Array.isArray(val) ? val : defaultVal;

    return {
        visual_identity: {
            color_palette_hex: asArray(data.visual_identity?.color_palette_hex || data.color_palette, def.visual_identity.color_palette_hex),
            photography_style: data.visual_identity?.photography_style || data.photography_style || def.visual_identity.photography_style,
            style_description: data.visual_identity?.style_description || data.style_description || def.visual_identity.style_description,
            forbidden_elements: asArray(data.visual_identity?.forbidden_elements || data.forbidden_elements, def.visual_identity.forbidden_elements),
        },
        voice: {
            tone: data.voice?.tone || data.tone || def.voice.tone,
            keywords: data.voice?.keywords || data.keywords || def.voice.keywords,
        },
        risk_thresholds: {
            nudity: data.risk_thresholds?.nudity || def.risk_thresholds.nudity,
            political: data.risk_thresholds?.political || def.risk_thresholds.political,
        }
    };
}

function validateAndSanitizeAuditResult(data: any): AuditResult {
    const score = typeof data.compliance_score === 'number' ? data.compliance_score : 50;
    return {
        compliance_score: score,
        pass: typeof data.pass === 'boolean' ? data.pass : score >= 90,
        heatmap_coordinates: Array.isArray(data.heatmap_coordinates) ? data.heatmap_coordinates : [],
        fix_instructions: data.fix_instructions || "Check guidelines.",
    };
}

function getDefaultConstitution(): BrandConstitution {
    return {
        visual_identity: {
            color_palette_hex: ["#000000", "#FFFFFF"],
            photography_style: "Modern",
            style_description: "Clean",
            forbidden_elements: [],
        },
        voice: { tone: "Professional", keywords: ["Quality"] },
        risk_thresholds: { nudity: "STRICT_ZERO_TOLERANCE", political: "STRICT_ZERO_TOLERANCE" },
    };
}

export { analyzeCanvasForConstitution as analyzeAndGenerateConstitution };
export { auditImageCompliance as auditAsset };
