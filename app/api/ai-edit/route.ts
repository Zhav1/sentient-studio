/**
 * AI Image Edit API Route
 * 
 * Uses Gemini 3 Pro Image for conversational multi-turn editing.
 * Supports thought signature preservation for context continuity.
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
        const { imageBase64, editPrompt, thoughtSignature } = body;

        if (!imageBase64 || !editPrompt) {
            return NextResponse.json(
                { error: "Missing imageBase64 or editPrompt" },
                { status: 400 }
            );
        }

        const client = getGeminiClient();

        // Use Gemini 3 Pro Image for editing
        const model = client.getGenerativeModel({
            model: "gemini-3-pro-image-preview",
            generationConfig: {
                // @ts-expect-error - responseModalities is valid for image generation
                responseModalities: ["image", "text"],
                temperature: 1.0,
            },
        });

        // Build the edit prompt
        const systemPrompt = `You are an AI image editor. Edit the provided image according to the user's instructions.

USER REQUEST: "${editPrompt}"

Apply the edit precisely. Maintain the overall composition and quality of the original image.
Return the edited image.`;

        // Create image part
        const imagePart = {
            inlineData: {
                mimeType: "image/png",
                data: imageBase64,
            },
        };

        // Generate edited image
        const result = await model.generateContent([systemPrompt, imagePart]);
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
        });
    } catch (error) {
        console.error("AI Edit error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "AI Edit failed" },
            { status: 500 }
        );
    }
}
