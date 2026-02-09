
import { NextResponse } from "next/server";
import { auditImageCompliance } from "@/lib/ai/gemini";
import { BrandConstitution } from "@/lib/types";

export const runtime = "nodejs"; // gemini.ts uses Node APIs
export const maxDuration = 60; // Allow 60s for audit

export async function POST(req: Request) {
    try {
        const { imageBase64, constitution } = await req.json();

        if (!imageBase64 || !constitution) {
            return NextResponse.json(
                { error: "Missing image or constitution" },
                { status: 400 }
            );
        }

        console.log("[Audit API] Starting audit...", { 
            imageLength: imageBase64.length,
            constitutionBytes: JSON.stringify(constitution).length 
        });

        // Call Gemini 3 Flash to audit
        const result = await auditImageCompliance(imageBase64, constitution as BrandConstitution);

        console.log("[Audit API] Audit complete:", { 
            score: result.compliance_score, 
            pass: result.pass,
            issues: result.heatmap_coordinates?.length 
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("[Audit API] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
