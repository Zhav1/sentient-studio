/**
 * AI Image Edit API Route
 * 
 * Uses Gemini 3 Pro Image for conversational multi-turn editing.
 * Supports:
 * - Full-image editing with natural language
 * - Mask-based inpainting (edit only selected regions)
 * - Thought signature preservation for context continuity
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
function getGeminiClient(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not set");
    }
    return new GoogleGenerativeAI(apiKey);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { imageBase64, editPrompt, maskBase64, thoughtSignature } = body;

        if (!imageBase64 || !editPrompt) {
            return NextResponse.json(
                { error: "Missing imageBase64 or editPrompt" },
                { status: 400 }
            );
        }

        const client = getGeminiClient();
        const hasMask = !!maskBase64;

        // Use Gemini 3 Pro Image for editing
        const model = client.getGenerativeModel({
            model: "gemini-3-pro-image-preview",
            generationConfig: {
                // @ts-expect-error - responseModalities is valid for image generation
                responseModalities: ["image", "text"],
                temperature: 1.0,
            },
        });

        // Build the edit prompt based on whether we have a mask
        let systemPrompt: string;

        if (hasMask) {
            // Mask-based inpainting prompt
            systemPrompt = `You are an AI image editor specializing in precise inpainting.

The user has selected a specific region of the image (shown in the mask - white areas indicate where to edit, black areas should be preserved).

USER REQUEST: "${editPrompt}"

CRITICAL INSTRUCTIONS:
1. ONLY modify the areas indicated by the white regions in the mask
2. The changes must blend seamlessly with the surrounding unmasked areas
3. Preserve the style, lighting, and color palette of the original image
4. The edges of your modifications should be smooth and natural, not abrupt
5. DO NOT modify anything in the black (masked-out) areas

Return the edited image with the requested changes applied ONLY to the masked region.`;
        } else {
            // Full-image edit prompt
            systemPrompt = `You are an AI image editor. Edit the provided image according to the user's instructions.

USER REQUEST: "${editPrompt}"

Apply the edit precisely. Maintain the overall composition and quality of the original image.
Return the edited image.`;
        }

        // Build content parts - image first, then mask if present
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contentParts: any[] = [];

        // Add the main image
        contentParts.push({
            inlineData: {
                mimeType: "image/png",
                data: imageBase64,
            },
        });

        // Add mask if present
        if (hasMask) {
            contentParts.push({
                text: "Here is the mask indicating which areas to edit (white = edit, black = preserve):",
            });
            contentParts.push({
                inlineData: {
                    mimeType: "image/png",
                    data: maskBase64,
                },
            });
        }

        // Add the system prompt
        contentParts.push({ text: systemPrompt });

        // Generate edited image
        const result = await model.generateContent(contentParts);
        const response = result.response;
        const parts = response.candidates?.[0]?.content?.parts || [];

        // Extract the generated image
        let newImageBase64: string | null = null;
        let textResponse: string | null = null;

        for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
                newImageBase64 = part.inlineData.data;
            }
            if (part.text) {
                textResponse = part.text;
            }
        }

        if (!newImageBase64) {
            return NextResponse.json(
                { error: "No image generated", text: textResponse },
                { status: 500 }
            );
        }

        // Return the edited image with thought signature for multi-turn
        return NextResponse.json({
            imageBase64: newImageBase64,
            text: textResponse,
            // Preserve thought signature for multi-turn context
            thoughtSignature: thoughtSignature || null,
            // Include mode info
            mode: hasMask ? "inpaint" : "full",
        });
    } catch (error) {
        console.error("AI Edit error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "AI Edit failed" },
            { status: 500 }
        );
    }
}
