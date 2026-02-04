"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MoodboardCanvas, ConstitutionSidebar } from "@/components/canvas";
import { useCanvasStore } from "@/lib/store";
import type { AnalyzeResponse } from "@/app/api/analyze/route";

export default function CanvasPage() {
    const {
        elements,
        constitution,
        isAnalyzing,
        setConstitution,
        setIsAnalyzing,
        setError,
    } = useCanvasStore();

    const [lastAnalyzedHashes, setLastAnalyzedHashes] = useState<string[]>([]);

    // Analyze canvas elements
    const handleAnalyze = useCallback(async () => {
        if (elements.length === 0) {
            setError("Add some elements to your canvas first!");
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brandId: "demo_brand", // For demo purposes
                    elements,
                    processedHashes: lastAnalyzedHashes,
                }),
            });

            if (!response.ok) {
                throw new Error("Analysis failed");
            }

            const data: AnalyzeResponse = await response.json();

            if (data.constitution) {
                setConstitution(data.constitution);
                setLastAnalyzedHashes((prev) => [...prev, ...data.newHashes]);
            }

            if (data.skippedCount > 0) {
                console.log(
                    `Skipped ${data.skippedCount} already-processed elements (deduplication)`
                );
            }
        } catch (err) {
            setError("Failed to analyze canvas. Please try again.");
            console.error("Analysis error:", err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [elements, lastAnalyzedHashes, setConstitution, setIsAnalyzing, setError]);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-border px-6 py-4 flex items-center justify-between glass">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xl font-bold neon-text">
                        Sentient Studio
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">Canvas</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || elements.length === 0}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium
                       hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
                    >
                        {isAnalyzing ? (
                            <>
                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <span>🧠</span>
                                <span>Analyze Canvas</span>
                            </>
                        )}
                    </button>

                    {/* Dashboard Link */}
                    <Link
                        href="/dashboard"
                        className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <span>📊</span>
                        <span>Dashboard</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Canvas Area */}
                <MoodboardCanvas />

                {/* Constitution Sidebar */}
                <ConstitutionSidebar />
            </div>

            {/* Status Bar */}
            <footer className="border-t border-border px-6 py-2 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                    <span>
                        {elements.length} element{elements.length !== 1 ? "s" : ""} on canvas
                    </span>
                    {constitution && (
                        <span className="text-primary">✓ Constitution generated</span>
                    )}
                </div>
                <div>
                    {lastAnalyzedHashes.length > 0 && (
                        <span>{lastAnalyzedHashes.length} hashes cached</span>
                    )}
                </div>
            </footer>
        </div>
    );
}
