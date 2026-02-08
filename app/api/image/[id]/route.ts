import { NextRequest, NextResponse } from "next/server";
import { getImage } from "@/lib/imageStore";

export const runtime = "nodejs";

/**
 * Fetch stored image by ID
 * Used because SSE can't reliably send 1MB+ base64 payloads
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: "Image ID required" }, { status: 400 });
    }

    const image = getImage(id);

    if (!image) {
        return NextResponse.json({ error: "Image not found or expired" }, { status: 404 });
    }

    return NextResponse.json({ image });
}
