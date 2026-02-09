import { NextRequest, NextResponse } from "next/server";
import { buildEnhancedPrompt, generateImageWithNanoBanana } from "@/lib/ai/gemini";
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

        console.log("[Generate API] Generating image with Nano Banana...", { promptLength: enhancedPrompt.length });

        // REAL AI GENERATION
        // Uses Gemini 3 Pro Image (Nano Banana) to generate high-fidelity assets
        let imageBase64: string | null = null;
        
        try {
            imageBase64 = await generateImageWithNanoBanana(prompt, {
                styleGuide: constitution.visual_identity.style_description,
                colorPalette: constitution.visual_identity.color_palette_hex,
                forbiddenElements: constitution.visual_identity.forbidden_elements,
                imageSize: "2K", // Default to high quality
                aspectRatio: "1:1" // Default square for now, could be dynamic
            });
        } catch (genError) {
             console.error("[Generate API] Generation failed:", genError);
             throw genError;
        }

        if (!imageBase64) {
            throw new Error("No image generated");
        }

        // Format as data URL
        const imageUrl = `data:image/png;base64,${imageBase64}`;

        return NextResponse.json({
            enhancedPrompt,
            imageUrl: imageUrl, 
            status: "success",
            message: "Asset generated successfully using Gemini 3 Pro Image",
        } satisfies GenerateResponse);
    } catch (error) {
        console.error("Agent B (Fabricator) error:", error);
        return NextResponse.json(
            { error: "Failed to generate asset", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
