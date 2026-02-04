import { NextRequest, NextResponse } from "next/server";
import { auditAsset } from "@/lib/ai";
import type { BrandConstitution, AuditResult } from "@/lib/types";

export interface AuditRequest {
    assetId: string;
    imageUrl: string;
    constitution: BrandConstitution;
}

export interface AuditResponse {
    assetId: string;
    result: AuditResult;
    recommendation: "APPROVE" | "REJECT" | "REGENERATE";
}

/**
 * Agent C: The Sentinel
 * POST /api/audit
 * 
 * Audits generated assets against the brand constitution.
 * Returns compliance score, heatmap of issues, and fix instructions.
 */
export async function POST(request: NextRequest) {
    try {
        const body: AuditRequest = await request.json();
        const { assetId, imageUrl, constitution } = body;

        if (!imageUrl) {
            return NextResponse.json(
                { error: "No image URL provided" },
                { status: 400 }
            );
        }

        if (!constitution) {
            return NextResponse.json(
                { error: "No brand constitution provided for audit" },
                { status: 400 }
            );
        }

        // Audit the asset using Gemini Vision (Agent C: The Sentinel)
        const result = await auditAsset(imageUrl, constitution);

        // Determine recommendation based on compliance score
        let recommendation: AuditResponse["recommendation"];
        if (result.pass) {
            recommendation = "APPROVE";
        } else if (result.compliance_score >= 70) {
            recommendation = "REGENERATE"; // Close enough, try again
        } else {
            recommendation = "REJECT"; // Too far off, needs manual intervention
        }

        return NextResponse.json({
            assetId,
            result,
            recommendation,
        } satisfies AuditResponse);
    } catch (error) {
        console.error("Agent C (Sentinel) error:", error);
        return NextResponse.json(
            { error: "Failed to audit asset" },
            { status: 500 }
        );
    }
}
