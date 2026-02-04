import { NextRequest } from "next/server";
import { runAgentLoop } from "@/lib/ai/gemini";
import type { AgentAction } from "@/lib/ai/tools";
import type { CanvasElement } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streaming Agent API Endpoint
 * Uses Server-Sent Events to stream agent actions in real-time
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt, canvasElements } = body as {
            prompt: string;
            canvasElements: CanvasElement[];
        };

        if (!prompt) {
            return new Response(JSON.stringify({ error: "Prompt is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Create a TransformStream for SSE
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Helper to send SSE events
        const sendEvent = async (event: string, data: unknown) => {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            await writer.write(encoder.encode(message));
        };

        // Run agent in background
        (async () => {
            try {
                // Send start event
                await sendEvent("start", {
                    message: "Agent starting...",
                    timestamp: Date.now()
                });

                // Run the agent loop with action callback
                const result = await runAgentLoop(
                    prompt,
                    canvasElements || [],
                    async (action: AgentAction) => {
                        // Stream each action to the client
                        await sendEvent("action", {
                            step: action.timestamp,
                            tool: action.tool,
                            input: summarizeInput(action.input),
                            thinking: getThinkingMessage(action.tool),
                        });
                    }
                );

                // Send final result
                await sendEvent("complete", {
                    success: result.success,
                    message: result.message,
                    hasImage: !!result.image,
                    image: result.image, // Base64 image data
                });

            } catch (error) {
                console.error("Agent error:", error);
                await sendEvent("error", {
                    message: error instanceof Error ? error.message : "Unknown error",
                });
            } finally {
                await writer.close();
            }
        })();

        return new Response(stream.readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error) {
        console.error("API error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

/**
 * Summarize input for display (avoid sending huge base64 strings)
 */
function summarizeInput(input: Record<string, unknown>): Record<string, unknown> {
    const summary: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
        if (typeof value === "string" && value.length > 100) {
            summary[key] = value.substring(0, 100) + "...";
        } else if (key.includes("base64") || key.includes("image")) {
            summary[key] = "[IMAGE DATA]";
        } else {
            summary[key] = value;
        }
    }

    return summary;
}

/**
 * Human-friendly thinking messages for each tool
 */
function getThinkingMessage(tool: string): string {
    switch (tool) {
        case "analyze_canvas":
            return "🔍 Analyzing your moodboard to understand the brand DNA...";
        case "generate_image":
            return "🎨 Generating image with Nano Banana...";
        case "audit_compliance":
            return "🛡️ Auditing image against brand guidelines...";
        case "refine_prompt":
            return "✏️ Refining the prompt based on audit feedback...";
        case "complete_task":
            return "✅ Task complete!";
        default:
            return `⚙️ Executing ${tool}...`;
    }
}
