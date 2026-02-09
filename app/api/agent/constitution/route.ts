
import { NextResponse } from "next/server";
import { analyzeCanvasForConstitution } from "@/lib/ai/gemini";

export async function POST(req: Request) {
    try {
        const { elements, settings } = await req.json();

        console.log("[Constitution API] Analyze Request:", {
            elementCount: elements.length,
            targetResolution: settings?.name || "Unknown"
        });

        // CRITICAL: Call the real Gemini 3 multi-modal analysis
        // This takes the base64 images from the canvas and extracts the brand DNA
        const constitution = await analyzeCanvasForConstitution(elements);

        console.log("[Constitution API] Analysis Complete:", {
            extractedColors: constitution.visual_identity.color_palette_hex.length,
            vibe: constitution.visual_identity.style_description
        });

        return NextResponse.json({ constitution });
    } catch (error) {
        console.error("[Constitution API] Analysis failed:", error);
        return NextResponse.json({
            error: "Analysis failed",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
