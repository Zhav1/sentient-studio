"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCanvasStore } from "@/lib/store/canvasStore";
import { getConstitution, saveConstitution, addCanvasElement } from "@/lib/firebase/firestore";
import type { AgentAction } from "@/lib/ai/tools";
import { EditableCanvas } from "@/components/editor";
import { createCanvasElement } from "@/lib/types";

interface AgentEvent {
    type: "start" | "action" | "complete" | "error";
    data: {
        step?: number;
        tool?: string;
        thinking?: string;
        message?: string;
        success?: boolean;
        hasImage?: boolean;
        image?: string;
        input?: Record<string, unknown>;
        output?: unknown;
    };
}

export default function DashboardPage() {
    const { constitution, setConstitution, elements, addElement, currentBrand } = useCanvasStore();

    const [prompt, setPrompt] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [events, setEvents] = useState<AgentEvent[]>([]);
    const [history, setHistory] = useState<AgentAction[]>([]);
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    // Load saved constitution from Firestore on mount
    useEffect(() => {
        async function loadSavedConstitution() {
            if (currentBrand?.id && !constitution) {
                try {
                    const saved = await getConstitution(currentBrand.id);
                    if (saved) {
                        setConstitution(saved);
                    }
                } catch (err) {
                    console.error("Failed to load saved constitution:", err);
                }
            }
        }
        loadSavedConstitution();
    }, [currentBrand?.id, constitution, setConstitution]);

    const runAgent = useCallback(async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }

        if (!constitution && elements.length === 0) {
            setError("No brand data. Go to Canvas and add some elements first.");
            return;
        }

        setIsRunning(true);
        setError(null);
        setEvents([]);
        setHistory([]);
        setFinalImage(null);

        abortRef.current = new AbortController();

        try {
            const response = await fetch("/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    canvasElements: elements,
                    savedConstitution: constitution,
                    brandId: currentBrand?.id,
                }),
                signal: abortRef.current.signal,
            });

            if (!response.ok) throw new Error("Failed to start agent");
            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                let currentEvent = "";
                for (const line of lines) {
                    if (line.startsWith("event: ")) {
                        currentEvent = line.slice(7);
                    } else if (line.startsWith("data: ") && currentEvent) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const event: AgentEvent = { type: currentEvent as AgentEvent["type"], data };
                            setEvents((prev) => [...prev, event]);

                            // Track history
                            if (currentEvent === "action" && data.tool) {
                                setHistory((prev) => [...prev, {
                                    timestamp: Date.now(),
                                    tool: data.tool,
                                    input: data.input || {},
                                    output: data.output,
                                    thinking: data.thinking,
                                }]);
                            }

                            if (currentEvent === "complete") {
                                console.log("[SSE] Complete event received:", {
                                    hasImage: data.hasImage,
                                    imageId: data.imageId,
                                });

                                // Fetch the image from the server if we have an imageId
                                if (data.imageId) {
                                    console.log("[SSE] Fetching image from /api/image/" + data.imageId);
                                    try {
                                        const imgResponse = await fetch(`/api/image/${data.imageId}`);
                                        const imgData = await imgResponse.json();
                                        if (imgData.image) {
                                            console.log("[SSE] Image fetched successfully, length:", imgData.image.length);
                                            setFinalImage(imgData.image);

                                            // Create a new canvas element for the moodboard
                                            const newElement = createCanvasElement("image", {
                                                url: `data:image/png;base64,${imgData.image}`,
                                                name: `Agent Generation: ${prompt.slice(0, 20)}...`,
                                                x: Math.random() * 300,
                                                y: Math.random() * 300,
                                            });

                                            // Update local store
                                            addElement(newElement);

                                            // Persist to Firestore if brand is active
                                            if (currentBrand?.id) {
                                                addCanvasElement(currentBrand.id, newElement).catch(console.error);
                                            }
                                        } else {
                                            console.error("[SSE] Image fetch failed:", imgData.error);
                                        }
                                    } catch (fetchError) {
                                        console.error("[SSE] Failed to fetch image:", fetchError);
                                    }
                                } else if (!data.hasImage) {
                                    console.log("[SSE] No image generated in this session");
                                }

                                // Update constitution in store and Firestore
                                if (data.constitution) {
                                    setConstitution(data.constitution);
                                    if (currentBrand?.id) {
                                        saveConstitution(currentBrand.id, data.constitution).catch(console.error);
                                    }
                                }
                            }
                        } catch {
                            // Skip malformed JSON
                        }
                        currentEvent = "";
                    }
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name !== "AbortError") {
                setError(err.message);
            }
        } finally {
            setIsRunning(false);
            abortRef.current = null;
        }
    }, [prompt, constitution, elements, currentBrand?.id]);

    const stopAgent = () => {
        abortRef.current?.abort();
        setIsRunning(false);
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
                    <span className="text-muted-foreground">Agent Dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${showHistory ? "bg-primary text-black" : "glass hover:bg-white/10"
                            }`}
                    >
                        📜 History
                    </button>
                    <Link
                        href="/canvas"
                        className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <span>🎨</span>
                        <span>Canvas</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid lg:grid-cols-3 gap-6">
                {/* Left: Input & Controls */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Constitution Status with Memory Indicator */}
                    <div className="glass-card rounded-xl p-4">
                        {constitution ? (
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🧠</span>
                                <div>
                                    <h3 className="font-semibold text-primary">Brand Memory Active</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {constitution.visual_identity.color_palette_hex.length} colors •{" "}
                                        {constitution.voice.keywords.length} keywords
                                    </p>
                                </div>
                            </div>
                        ) : elements.length > 0 ? (
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📋</span>
                                <div>
                                    <h3 className="font-semibold text-yellow-400">Canvas Ready</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {elements.length} elements - Agent will analyze first
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">⚠️</span>
                                <div>
                                    <h3 className="font-semibold text-yellow-400">No Brand Data</h3>
                                    <Link href="/canvas" className="text-sm text-primary hover:underline">
                                        Go to Canvas to create your moodboard
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Prompt Input */}
                    <div className="glass-card rounded-2xl p-6">
                        <h2 className="text-xl font-semibold mb-4">🤖 Agent Task</h2>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Create a summer sale poster with tropical vibes"
                            className="w-full p-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                            rows={3}
                            disabled={isRunning}
                        />

                        {error && (
                            <div className="mt-3 text-red-400 text-sm flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="mt-4 flex gap-3">
                            {!isRunning ? (
                                <button
                                    onClick={runAgent}
                                    disabled={!prompt.trim()}
                                    className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-black font-semibold
                             hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                                >
                                    <span>🚀</span>
                                    <span>Run Agent</span>
                                </button>
                            ) : (
                                <button
                                    onClick={stopAgent}
                                    className="flex-1 px-6 py-4 rounded-xl bg-red-500/20 text-red-400 font-semibold
                             hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>⏹️</span>
                                    <span>Stop Agent</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Agent Activity Feed */}
                    <div className="glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span>💭</span>
                            <span>Agent Thinking</span>
                            {isRunning && (
                                <span className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse" />
                            )}
                        </h3>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto">
                            {events.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-6">
                                    Agent reasoning will appear here...
                                </p>
                            ) : (
                                events.map((event, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-lg text-sm ${event.type === "error"
                                            ? "bg-red-500/10 border border-red-500/20"
                                            : event.type === "complete"
                                                ? "bg-green-500/10 border border-green-500/20"
                                                : "bg-white/5"
                                            }`}
                                    >
                                        {event.data.thinking && (
                                            <p className="text-muted-foreground italic mb-2">
                                                💭 "{event.data.thinking}"
                                            </p>
                                        )}
                                        {event.data.tool && (
                                            <p className="text-primary font-mono text-xs">
                                                → {event.data.tool}()
                                            </p>
                                        )}
                                        {event.data.message && (
                                            <p className={event.type === "complete" ? "text-green-400" : ""}>
                                                {event.data.message}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Center: Generated Image */}
                <div className="glass-card rounded-2xl p-6 flex flex-col lg:col-span-1">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>🖼️</span>
                        <span>Generated Asset</span>
                    </h3>

                    <div className="flex-1 rounded-xl bg-background/50 border border-dashed border-border flex items-center justify-center min-h-[400px] relative overflow-hidden">
                        {isRunning && !finalImage ? (
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                <p className="text-muted-foreground">Agent is working...</p>
                            </div>
                        ) : finalImage && finalImage !== "PLACEHOLDER_IMAGE_BASE64" ? (
                            <Image
                                src={`data:image/png;base64,${finalImage}`}
                                alt="Generated asset"
                                fill
                                className="object-contain"
                            />
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <div className="text-5xl mb-4">🎨</div>
                                <p>Generated image will appear here</p>
                            </div>
                        )}
                    </div>

                    {finalImage && finalImage !== "PLACEHOLDER_IMAGE_BASE64" && (
                        <div className="mt-4 flex gap-3">
                            <button
                                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-all"
                                onClick={() => setShowEditor(true)}
                            >
                                ✨ Edit in Canvas
                            </button>
                            <button
                                className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all"
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = `data:image/png;base64,${finalImage}`;
                                    link.download = "sentient-asset.png";
                                    link.click();
                                }}
                            >
                                💾
                            </button>
                            <button
                                className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all"
                                onClick={() => setFinalImage(null)}
                            >
                                🔄
                            </button>
                        </div>
                    )}
                </div>

                {/* Canvas Editor Modal */}
                {showEditor && finalImage && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                        <div className="w-full max-w-5xl max-h-[90vh] overflow-auto glass-card rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <span>✨</span>
                                    <span>Canvas Editor</span>
                                </h2>
                                <button
                                    onClick={() => setShowEditor(false)}
                                    className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all"
                                >
                                    ✕ Close
                                </button>
                            </div>
                            <EditableCanvas
                                imageBase64={finalImage}
                                onSave={(dataUrl) => {
                                    // Extract base64 from data URL and update finalImage
                                    const base64 = dataUrl.split(",")[1];
                                    if (base64) setFinalImage(base64);
                                    setShowEditor(false);
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Right: History Panel */}
                <div className={`glass-card rounded-2xl p-6 lg:col-span-1 ${showHistory ? "" : "hidden lg:block"}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>📜</span>
                        <span>Agent History</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                            {history.length} steps
                        </span>
                    </h3>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {history.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-6">
                                Agent steps will be logged here for review and debugging.
                            </p>
                        ) : (
                            history.map((action, i) => (
                                <div
                                    key={i}
                                    className="p-3 rounded-lg bg-white/5 border border-border/50"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-muted-foreground">#{i + 1}</span>
                                        <span className="font-mono text-sm text-primary">{action.tool}</span>
                                    </div>
                                    {action.thinking && (
                                        <p className="text-xs text-muted-foreground italic mb-1">
                                            {action.thinking.slice(0, 100)}...
                                        </p>
                                    )}
                                    <details className="text-xs">
                                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                            View details
                                        </summary>
                                        <pre className="mt-2 p-2 bg-background rounded text-[10px] overflow-auto max-h-[100px]">
                                            {JSON.stringify(action.input, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
