import type { BrandConstitution, CanvasElement } from "@/lib/types";

/**
 * Tool definitions for Gemini function calling
 * These define what actions the AI agent can take autonomously
 */

// Tool declaration schemas (follows Gemini's function calling spec)
export const AGENT_TOOLS = [
    {
        name: "analyze_canvas",
        description:
            "Analyze the brand canvas/moodboard to extract the Brand Constitution including color palette, visual style, tone, and forbidden elements. Call this first before generating any assets.",
        parameters: {
            type: "object",
            properties: {
                canvas_elements: {
                    type: "array",
                    description: "List of canvas elements to analyze",
                    items: {
                        type: "object",
                        properties: {
                            type: { type: "string", enum: ["image", "note", "color"] },
                            url: { type: "string", description: "URL for images" },
                            text: { type: "string", description: "Text content for notes" },
                            color: { type: "string", description: "Hex color for swatches" },
                        },
                    },
                },
            },
            required: ["canvas_elements"],
        },
    },
    {
        name: "generate_image",
        description:
            "Generate a marketing image using Nano Banana Pro based on the user's prompt and brand constitution. Supports 4K resolution and multiple aspect ratios.",
        parameters: {
            type: "object",
            properties: {
                prompt: {
                    type: "string",
                    description: "The creative prompt for image generation",
                },
                style_guide: {
                    type: "string",
                    description: "Style instructions from brand constitution",
                },
                color_palette: {
                    type: "array",
                    items: { type: "string" },
                    description: "Hex colors to use",
                },
                forbidden_elements: {
                    type: "array",
                    items: { type: "string" },
                    description: "Elements to avoid",
                },
                aspect_ratio: {
                    type: "string",
                    enum: ["1:1", "16:9", "9:16", "4:3", "3:4"],
                    description: "Aspect ratio of the generated image (default: 1:1)",
                },
                image_size: {
                    type: "string",
                    enum: ["1K", "2K", "4K"],
                    description: "Resolution: 1K (1024px), 2K (2048px), 4K (4096px). Default: 2K",
                },
            },
            required: ["prompt"],
        },
    },
    {
        name: "audit_compliance",
        description:
            "Audit a generated image against the brand constitution. Returns compliance score, issues, and whether to approve or regenerate.",
        parameters: {
            type: "object",
            properties: {
                image_base64: {
                    type: "string",
                    description: "Base64 encoded image to audit",
                },
                constitution: {
                    type: "object",
                    description: "Brand constitution to check against",
                },
            },
            required: ["image_base64", "constitution"],
        },
    },
    {
        name: "refine_prompt",
        description:
            "Refine the generation prompt based on audit feedback. Call this when an image fails audit to create a better prompt for retry.",
        parameters: {
            type: "object",
            properties: {
                original_prompt: {
                    type: "string",
                    description: "The original prompt that was used",
                },
                audit_feedback: {
                    type: "string",
                    description: "Feedback from the audit about what was wrong",
                },
                issues: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific issues to fix",
                },
            },
            required: ["original_prompt", "audit_feedback"],
        },
    },
    {
        name: "search_trends",
        description:
            "Search the web for current design trends, brand inspiration, or market research. Use this to enhance generation with real-world context.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Search query for trends or inspiration",
                },
            },
            required: ["query"],
        },
    },
    {
        name: "complete_task",
        description:
            "Signal that the task is complete. Call this when an image passes audit or when giving up after max retries.",
        parameters: {
            type: "object",
            properties: {
                success: {
                    type: "boolean",
                    description: "Whether the task completed successfully",
                },
                final_image_base64: {
                    type: "string",
                    description: "The final approved image as base64",
                },
                message: {
                    type: "string",
                    description: "Message to show the user",
                },
            },
            required: ["success", "message"],
        },
    },
];

/**
 * Tool execution results - what we return to the model after executing a tool
 */
export interface ToolResult {
    name: string;
    result: unknown;
}

/**
 * Agent state during execution
 */
export interface AgentState {
    step: number;
    phase: "planning" | "analyzing" | "generating" | "auditing" | "refining" | "complete";
    constitution: BrandConstitution | null;
    currentImage: string | null; // base64
    auditScore: number | null;
    attempts: number;
    maxAttempts: number;
    history: AgentAction[];
    canvasElements?: CanvasElement[]; // Original elements with image data for multimodal analysis
}

/**
 * Single agent action for history/display
 */
export interface AgentAction {
    timestamp: number;
    tool: string;
    input: Record<string, unknown>;
    output: unknown;
    thinking?: string;
}

/**
 * Create initial agent state
 */
export function createAgentState(): AgentState {
    return {
        step: 0,
        phase: "planning",
        constitution: null,
        currentImage: null,
        auditScore: null,
        attempts: 0,
        maxAttempts: 3,
        history: [],
    };
}
