import { NextRequest, NextResponse } from "next/server";
import { analyzeAndGenerateConstitution } from "@/lib/ai";
import type { CanvasElement, BrandConstitution } from "@/lib/types";

export interface AnalyzeRequest {
    brandId: string;
    elements: CanvasElement[];
    processedHashes?: string[]; // Hashes already processed (for deduplication)
}

export interface AnalyzeResponse {
    constitution: BrandConstitution;
    newHashes: string[]; // Newly processed hashes
    skippedCount: number; // Number of elements skipped due to deduplication
}

/**
 * Agent A: The Archivist
 * POST /api/analyze
 * 
 * Analyzes canvas elements and generates the Brand Constitution.
 * Implements deduplication via hash checking.
 */
export async function POST(request: NextRequest) {
    try {
        const body: AnalyzeRequest = await request.json();
        const { elements, processedHashes = [] } = body;

        if (!elements || elements.length === 0) {
            return NextResponse.json(
                { error: "No canvas elements provided" },
                { status: 400 }
            );
        }

        // DEBUG: Log incoming elements
        console.log(`[/api/analyze] Received ${elements.length} elements`);
        elements.forEach((el, i) => {
            const urlPreview = el.url ? (el.url.startsWith('data:') ? `data:${el.url.slice(5, 30)}...` : el.url.slice(0, 50)) : 'NO URL';
            console.log(`  [${i}] type=${el.type}, hash=${el.hash?.slice(0, 8) || 'none'}, url=${urlPreview}`);
        });

        // Deduplication: Filter out already-processed elements
        const newElements = elements.filter(
            (el) => el.hash && !processedHashes.includes(el.hash)
        );
        const skippedCount = elements.length - newElements.length;

        // If all elements were already processed, return cached message
        if (newElements.length === 0 && processedHashes.length > 0) {
            return NextResponse.json({
                constitution: null,
                newHashes: [],
                skippedCount,
                message: "All elements already processed - using cached constitution",
            });
        }

        // Analyze with Gemini (Agent A: The Archivist)
        const constitution = await analyzeAndGenerateConstitution(
            newElements.length > 0 ? newElements : elements
        );

        // Collect new hashes for caching
        const newHashes = newElements
            .filter((el) => el.hash)
            .map((el) => el.hash as string);

        return NextResponse.json({
            constitution,
            newHashes,
            skippedCount,
        } satisfies AnalyzeResponse);
    } catch (error) {
        console.error("Agent A (Archivist) error:", error);
        return NextResponse.json(
            { error: "Failed to analyze canvas elements" },
            { status: 500 }
        );
    }
}
