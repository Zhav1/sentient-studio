import { NextRequest, NextResponse } from "next/server";
import { buildEnhancedPrompt } from "@/lib/ai";
import type { BrandConstitution } from "@/lib/types";

export interface GenerateRequest {
    campaignId: string;
    prompt: string;
    constitution: BrandConstitution;
}

export interface GenerateResponse {
    enhancedPrompt: string;
    imageUrl: string | null;
    status: "success" | "pending";
    message: string;
}

/**
 * Agent B: The Fabricator
 * POST /api/generate
 * 
 * Generates marketing assets based on user prompt + brand constitution.
 * Returns an enhanced prompt and (when image generation is available) the generated image.
 */
export async function POST(request: NextRequest) {
    try {
        const body: GenerateRequest = await request.json();
        const { prompt, constitution } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: "No prompt provided" },
                { status: 400 }
            );
        }

        if (!constitution) {
            return NextResponse.json(
                { error: "No brand constitution provided. Analyze canvas first." },
                { status: 400 }
            );
        }

        // Build the enhanced prompt using the constitution
        const enhancedPrompt = buildEnhancedPrompt(prompt, constitution);

        // TODO: When Gemini image generation is available, generate the actual image here
        // For now, we return the enhanced prompt for manual use or external generation

        // Placeholder response
        return NextResponse.json({
            enhancedPrompt,
            imageUrl: null, // Will be populated when image generation is integrated
            status: "pending",
            message: "Enhanced prompt generated. Image generation coming soon.",
        } satisfies GenerateResponse);
    } catch (error) {
        console.error("Agent B (Fabricator) error:", error);
        return NextResponse.json(
            { error: "Failed to generate asset" },
            { status: 500 }
        );
    }
}
