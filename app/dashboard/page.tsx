"use client";

import { useState } from "react";
import Link from "next/link";
import { useCanvasStore, useCampaignStore } from "@/lib/store";
import type { GenerateResponse } from "@/app/api/generate/route";

export default function DashboardPage() {
    const { constitution } = useCanvasStore();
    const { campaigns, isGenerating, setIsGenerating } = useCampaignStore();

    const [prompt, setPrompt] = useState("");
    const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }

        if (!constitution) {
            setError("No brand constitution found. Go to Canvas and analyze first.");
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedPrompt(null);

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campaignId: `camp_${Date.now()}`,
                    prompt,
                    constitution,
                }),
            });

            if (!response.ok) {
                throw new Error("Generation failed");
            }

            const data: GenerateResponse = await response.json();
            setGeneratedPrompt(data.enhancedPrompt);
        } catch (err) {
            setError("Failed to generate. Please try again.");
            console.error("Generation error:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-border px-6 py-4 flex items-center justify-between glass">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xl font-bold neon-text">
                        Sentient Studio
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">Dashboard</span>
                </div>

                <Link
                    href="/canvas"
                    className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all flex items-center gap-2"
                >
                    <span>🎨</span>
                    <span>Canvas</span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
                {/* Constitution Status */}
                <div className="mb-8">
                    {constitution ? (
                        <div className="glass-card rounded-xl p-4 flex items-center gap-4 neon-glow">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-2xl">✓</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-primary">Brand Constitution Active</h3>
                                <p className="text-sm text-muted-foreground">
                                    Style: {constitution.visual_identity.photography_style.slice(0, 50)}...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card rounded-xl p-4 flex items-center gap-4 border-yellow-500/30">
                            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-yellow-400">No Brand Constitution</h3>
                                <p className="text-sm text-muted-foreground">
                                    <Link href="/canvas" className="text-primary hover:underline">
                                        Go to Canvas
                                    </Link>{" "}
                                    to create your brand identity first.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Generate Section */}
                <div className="glass-card rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Generate Marketing Asset</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Your Prompt
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., A runner sprinting through Tokyo at night"
                                className="w-full p-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                rows={3}
                            />
                        </div>

                        {error && (
                            <div className="text-red-400 text-sm flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !constitution}
                            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-black font-semibold
                         hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <span>✨</span>
                                    <span>Generate Asset</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Generated Prompt Display */}
                {generatedPrompt && (
                    <div className="glass-card rounded-2xl p-6 animate-in">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <span>🎯</span>
                            <span>Enhanced Prompt (Agent B Output)</span>
                        </h3>
                        <div className="bg-background rounded-xl p-4 font-mono text-sm whitespace-pre-wrap border border-border">
                            {generatedPrompt}
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            💡 Use this enhanced prompt with image generation tools like Midjourney, DALL-E, or Gemini Imagen.
                        </p>
                    </div>
                )}

                {/* Previous Campaigns (Placeholder) */}
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Recent Campaigns</h2>
                    {campaigns.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground glass-card rounded-2xl">
                            <div className="text-4xl mb-4">📁</div>
                            <p>No campaigns yet. Generate your first asset above!</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {campaigns.map((campaign) => (
                                <div key={campaign.id} className="glass-card rounded-xl p-4">
                                    <h3 className="font-medium">{campaign.title}</h3>
                                    <p className="text-sm text-muted-foreground">{campaign.user_prompt}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
