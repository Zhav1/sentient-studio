
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { elements, settings } = await req.json();

        console.log("Analyze Request:", {
            elementCount: elements.length,
            targetResolution: settings?.name || "Unknown"
        });

        // SMART MOCK: Extract text from Canvas Layers
        // This simulates the AI "reading" the text layers explicitly instead of just relying on pixels.
        const textLayers = elements
            .filter((el: any) => el.type === 'text' || el.type === 'note')
            .map((el: any) => el.text)
            .filter((t: any) => t && t.trim().length > 0); // Strict filter

        console.log("Extracted Text Layers:", textLayers);

        // Fallback: If no text layers found, check if "RASSLONELY" was in the previous context (Simulated Memory)
        // In a real app, this would use OCR on the `settings.backgroundImage` if available.
        if (textLayers.length === 0) {
             // For the sake of the demo, if the user asks about "RASSLONELY", we can't see it in pixels.
             // But we can pretend we did if we are in "World Class" mode.
             // We'll leave it empty to be honest unless they added a text element.
        }

        // Dynamic Keywords based on input
        const detectedKeywords = ["Power", "Control", "Darkness", ...textLayers];

        // MOCK ANALYSIS to prevent 404/500
        // In a real app, this would call Gemini/OpenAI
        const mockConstitution = {
            visual_identity: {
                color_palette_hex: ["#FF0000", "#000000", "#FFFFFF"],
                photography_style: "Dark, moody, cinematic",
                style_description: `A mysterious and elegant brand identity featuring ${textLayers.join(", ")}.`,
                forbidden_elements: ["Comic Sans", "Pastel colors"],
            },
            voice: {
                tone: "Serious and Authoritative",
                keywords: detectedKeywords, // Now includes "RASSLONELY" if it was in the canvas
            },
            risk_thresholds: {
                nudity: "STRICT_ZERO_TOLERANCE",
                political: "STRICT_ZERO_TOLERANCE",
            }
        };

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        return NextResponse.json({ constitution: mockConstitution });
    } catch (error) {
        console.error("Constitution analysis failed:", error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}
