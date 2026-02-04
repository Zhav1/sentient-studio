"use client";

import { useState, useCallback } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface AIEditPanelProps {
    currentImageBase64: string | null;
    onEditComplete: (newImageBase64: string) => void;
}

/**
 * AIEditPanel - Natural language image editing via Gemini 3 Pro Image
 * 
 * Uses conversational multi-turn editing with thought signature preservation
 */
export function AIEditPanel({
    currentImageBase64,
    onEditComplete,
}: AIEditPanelProps) {
    const [prompt, setPrompt] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAIEdit = useCallback(async () => {
        if (!prompt.trim() || !currentImageBase64) return;

        setIsEditing(true);
        setError(null);

        try {
            const response = await fetch("/api/ai-edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: currentImageBase64,
                    editPrompt: prompt.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error("AI edit failed");
            }

            const data = await response.json();

            if (data.imageBase64) {
                onEditComplete(data.imageBase64);
                setPrompt(""); // Clear prompt on success
            } else {
                throw new Error("No image returned from AI");
            }
        } catch (err) {
            console.error("AI Edit error:", err);
            setError(err instanceof Error ? err.message : "AI edit failed");
        } finally {
            setIsEditing(false);
        }
    }, [prompt, currentImageBase64, onEditComplete]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAIEdit();
        }
    };

    return (
        <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="text-purple-400" size={18} />
                <h3 className="text-sm font-medium text-white/80">AI Edit</h3>
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe the edit... e.g., 'Add a sale badge in the corner'"
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 transition-all"
                    disabled={isEditing || !currentImageBase64}
                />
                <button
                    onClick={handleAIEdit}
                    disabled={isEditing || !prompt.trim() || !currentImageBase64}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center gap-2"
                >
                    {isEditing ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            Editing...
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            Apply
                        </>
                    )}
                </button>
            </div>

            {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
            )}

            <p className="mt-3 text-xs text-white/40">
                Powered by Gemini 3 Pro Image — multi-turn conversational editing
            </p>
        </div>
    );
}

export default AIEditPanel;
