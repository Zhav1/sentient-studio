
import { NextResponse } from "next/server";
import { analyzeCanvasForConstitution } from "@/lib/ai/gemini";

export const runtime = "nodejs"; // gemini.ts uses Node APIs
export const maxDuration = 60; // Allow 60s for analysis

export async function POST(req: Request) {
    try {
        const { elements, settings } = await req.json();

        console.log("[Constitution API] Starting analysis...", {
            elementCount: elements?.length || 0,
            targetResolution: settings?.name || "Unknown"
        });

        if (!elements || elements.length === 0) {
             return NextResponse.json(
                { error: "No canvas elements provided" },
                { status: 400 }
            );
        }

        // REAL AI ANALYSIS
        // Calls Gemini 3 Flash to look at the actual images/text in the canvas
        const constitution = await analyzeCanvasForConstitution(elements);

        console.log("[Constitution API] Analysis complete:", {
             style: constitution.visual_identity.style_description,
             colors: constitution.visual_identity.color_palette_hex
        });

        return NextResponse.json({ constitution });
    } catch (error) {
        console.error("[Constitution API] Analysis failed:", error);
        return NextResponse.json(
            { error: "Constitution analysis failed", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
