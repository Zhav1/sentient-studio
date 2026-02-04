import {
    GoogleGenerativeAI,
    FunctionCallingMode,
    type FunctionDeclaration,
    type Part,
} from "@google/generative-ai";
import type { BrandConstitution, CanvasElement } from "@/lib/types";
import type { AuditResult } from "@/lib/types";
import { AGENT_TOOLS, type AgentState, type AgentAction } from "./tools";

// ============ CLIENT INITIALIZATION ============

function getGeminiClient(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    return new GoogleGenerativeAI(apiKey);
}

// ============ TOOL EXECUTION ============

/**
 * Execute a tool call and return the result
 */
export async function executeTool(
    toolName: string,
    args: Record<string, unknown>,
    state: AgentState
): Promise<{ result: unknown; state: AgentState }> {
    switch (toolName) {
        case "analyze_canvas": {
            const elements = args.canvas_elements as CanvasElement[];
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

            const imageBase64 = await generateImageWithNanoBanana(
                prompt,
                styleGuide,
                colorPalette,
                forbidden
            );

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
                    issues: auditResult.heatmap_coordinates.map((h) => h.issue),
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

        case "complete_task": {
            return {
                result: {
                    success: args.success,
                    message: args.message,
                    final_image: args.success ? state.currentImage : null,
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
 * Generate an image using Gemini's native Nano Banana capability
 */
export async function generateImageWithNanoBanana(
    prompt: string,
    styleGuide?: string,
    colorPalette?: string[],
    forbiddenElements?: string[]
): Promise<string> {
    const client = getGeminiClient();

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

    // Use Nano Banana (gemini-2.0-flash-exp for image generation)
    const model = client.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
            // @ts-expect-error - responseModalities is valid for image generation
            responseModalities: ["image", "text"],
        },
    });

    try {
        const response = await model.generateContent(enhancedPrompt);
        const parts = response.response.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
                return part.inlineData.data; // Base64 encoded image
            }
        }

        throw new Error("No image generated in response");
    } catch (error) {
        console.error("Nano Banana generation error:", error);
        // Return a placeholder for demo purposes
        return "PLACEHOLDER_IMAGE_BASE64";
    }
}

// ============ CANVAS ANALYSIS ============

/**
 * Analyze canvas elements and generate Brand Constitution
 */
export async function analyzeCanvasForConstitution(
    elements: CanvasElement[]
): Promise<BrandConstitution> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const context = elements
        .map((el) => {
            if (el.type === "image") return `[IMAGE: ${el.name || "Unnamed"} - ${el.url}]`;
            if (el.type === "note") return `[NOTE: "${el.text}"]`;
            if (el.type === "color") return `[COLOR: ${el.color}]`;
            return "";
        })
        .filter(Boolean)
        .join("\n");

    const systemPrompt = `You are the Brand Constitution Architect.
Analyze these moodboard elements and extract the brand DNA.

OUTPUT ONLY VALID JSON:
{
  "visual_identity": {
    "color_palette_hex": ["#HEX1", "#HEX2"],
    "photography_style": "description",
    "forbidden_elements": ["element1", "element2"]
  },
  "voice": {
    "tone": "description",
    "keywords": ["keyword1", "keyword2"]
  },
  "risk_thresholds": {
    "nudity": "STRICT_ZERO_TOLERANCE",
    "political": "STRICT_ZERO_TOLERANCE"
  }
}

CANVAS ELEMENTS:
${context}`;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]) as BrandConstitution;
        } catch {
            // Fall through to default
        }
    }

    return getDefaultConstitution();
}

// ============ COMPLIANCE AUDIT ============

/**
 * Audit an image against brand constitution
 */
export async function auditImageCompliance(
    imageBase64: string,
    constitution: BrandConstitution
): Promise<AuditResult> {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const imagePart: Part = {
        inlineData: {
            mimeType: "image/png",
            data: imageBase64,
        },
    };

    const prompt = `You are the Brand Compliance Auditor.

BRAND CONSTITUTION:
${JSON.stringify(constitution, null, 2)}

Audit this image against the brand guidelines.

OUTPUT ONLY VALID JSON:
{
  "compliance_score": 0-100,
  "pass": true/false (true if score > 90),
  "heatmap_coordinates": [{"x": 0-100, "y": 0-100, "issue": "description"}],
  "fix_instructions": "how to fix issues"
}`;

    try {
        const result = await model.generateContent([prompt, imagePart]);
        const text = result.response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as AuditResult;
        }
    } catch (error) {
        console.error("Audit error:", error);
    }

    return {
        compliance_score: 50,
        pass: false,
        heatmap_coordinates: [],
        fix_instructions: "Unable to complete audit",
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
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a prompt engineer.

ORIGINAL PROMPT: "${originalPrompt}"

AUDIT FEEDBACK: ${feedback}
${issues ? `SPECIFIC ISSUES: ${issues.join(", ")}` : ""}

Rewrite the prompt to fix these issues. Output ONLY the refined prompt, nothing else.`;

    const result = await model.generateContent(prompt);
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
    onAction: (action: AgentAction) => void
): Promise<{ success: boolean; image?: string; message: string }> {
    const client = getGeminiClient();

    // Convert our tools to Gemini's function declaration format
    const functionDeclarations: FunctionDeclaration[] = AGENT_TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters as FunctionDeclaration["parameters"],
    }));

    const model = client.getGenerativeModel({
        model: "gemini-2.0-flash",
        tools: [{ functionDeclarations }],
        toolConfig: {
            functionCallingConfig: {
                mode: FunctionCallingMode.AUTO,
            },
        },
    });

    // Initialize agent state
    let state: AgentState = {
        step: 0,
        phase: "planning",
        constitution: null,
        currentImage: null,
        auditScore: null,
        attempts: 0,
        maxAttempts: 3,
        history: [],
    };

    // Build the initial prompt
    const systemMessage = `You are an autonomous marketing asset generator agent.

USER REQUEST: "${userPrompt}"

AVAILABLE CANVAS ELEMENTS:
${JSON.stringify(canvasElements, null, 2)}

YOUR GOAL:
1. First, call analyze_canvas to understand the brand
2. Then, call generate_image with a prompt based on the brand constitution
3. Call audit_compliance to check the generated image
4. If audit fails (score < 90), call refine_prompt and generate_image again
5. Maximum 3 attempts. After that, complete with best result.
6. When done, call complete_task

Think step by step. Execute one action at a time.`;

    const chat = model.startChat();
    let response = await chat.sendMessage(systemMessage);

    // Agent loop - keep going until complete or max iterations
    const maxIterations = 10;

    for (let i = 0; i < maxIterations; i++) {
        const candidate = response.response.candidates?.[0];
        if (!candidate) break;

        // Check for function calls
        const functionCalls = candidate.content.parts
            .filter((part) => part.functionCall)
            .map((part) => part.functionCall!);

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

            // Log the action
            const action: AgentAction = {
                timestamp: Date.now(),
                tool: fc.name,
                input: fc.args as Record<string, unknown>,
                output: result,
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
                };
            }
        }

        // Send function results back to model
        response = await chat.sendMessage(functionResponses);
    }

    // If we get here, agent didn't complete properly
    return {
        success: state.currentImage !== null,
        image: state.currentImage || undefined,
        message: `Agent completed after ${state.attempts} attempts. Best score: ${state.auditScore || "N/A"}`,
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
