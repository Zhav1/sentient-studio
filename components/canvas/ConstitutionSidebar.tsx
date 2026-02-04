"use client";

import { useCanvasStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ConstitutionSidebar() {
    const { constitution, isAnalyzing } = useCanvasStore();

    if (!constitution && !isAnalyzing) {
        return (
            <aside className="w-80 border-l border-border p-6 bg-card/50">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>🧠</span>
                    <span>Brand Constitution</span>
                </h2>
                <div className="text-center text-muted-foreground py-12">
                    <div className="text-4xl mb-4">📋</div>
                    <p>Add elements to your canvas and click &ldquo;Analyze&rdquo; to generate your Brand Constitution.</p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-80 border-l border-border p-6 bg-card/50 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🧠</span>
                <span>Brand Constitution</span>
                {isAnalyzing && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
            </h2>

            {isAnalyzing && !constitution && (
                <div className="space-y-4">
                    <div className="h-4 bg-border rounded animate-pulse" />
                    <div className="h-4 bg-border rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-border rounded animate-pulse w-1/2" />
                </div>
            )}

            {constitution && (
                <div className="space-y-6 constitution-update">
                    {/* Color Palette */}
                    <section>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                            Color Palette
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {(constitution.visual_identity?.color_palette_hex || []).map((color, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg glass"
                                >
                                    <div
                                        className="w-4 h-4 rounded-full ring-1 ring-white/20"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="font-mono text-xs">{color}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Photography Style */}
                    <section>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Visual Style
                        </h3>
                        <p className="text-sm glass-card p-3 rounded-lg">
                            {constitution.visual_identity?.photography_style || "No style defined"}
                        </p>
                    </section>

                    {/* Forbidden Elements */}
                    {(constitution.visual_identity?.forbidden_elements?.length ?? 0) > 0 && (
                        <section>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                ⛔ Forbidden Elements
                            </h3>
                            <ul className="space-y-1">
                                {(constitution.visual_identity?.forbidden_elements || []).map((el, i) => (
                                    <li
                                        key={i}
                                        className="text-sm text-red-400/80 flex items-center gap-2"
                                    >
                                        <span>•</span>
                                        <span>{el}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Voice & Tone */}
                    <section>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Voice & Tone
                        </h3>
                        <p className="text-sm mb-2 glass-card p-3 rounded-lg">
                            {constitution.voice?.tone || "No tone defined"}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {(constitution.voice?.keywords || []).map((keyword, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 rounded text-xs bg-primary/20 text-primary"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* Risk Thresholds */}
                    <section>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Risk Thresholds
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="glass-card p-2 rounded-lg">
                                <span className="text-muted-foreground">Nudity:</span>
                                <span
                                    className={cn(
                                        "ml-1 font-medium",
                                        constitution.risk_thresholds?.nudity === "STRICT_ZERO_TOLERANCE"
                                            ? "text-red-400"
                                            : "text-yellow-400"
                                    )}
                                >
                                    {constitution.risk_thresholds?.nudity === "STRICT_ZERO_TOLERANCE"
                                        ? "Strict"
                                        : "Artistic OK"}
                                </span>
                            </div>
                            <div className="glass-card p-2 rounded-lg">
                                <span className="text-muted-foreground">Political:</span>
                                <span
                                    className={cn(
                                        "ml-1 font-medium",
                                        constitution.risk_thresholds?.political === "STRICT_ZERO_TOLERANCE"
                                            ? "text-red-400"
                                            : "text-yellow-400"
                                    )}
                                >
                                    {constitution.risk_thresholds?.political === "STRICT_ZERO_TOLERANCE"
                                        ? "Strict"
                                        : "Satire OK"}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </aside>
    );
}
