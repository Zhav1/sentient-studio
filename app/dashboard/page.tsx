"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCanvasStore } from "@/lib/store";

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
    };
}

export default function DashboardPage() {
    const { constitution, elements } = useCanvasStore();

    const [prompt, setPrompt] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [events, setEvents] = useState<AgentEvent[]>([]);
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

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
        setFinalImage(null);

        abortRef.current = new AbortController();

        try {
            const response = await fetch("/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt,
                    canvasElements: elements,
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

                for (const line of lines) {
                    if (line.startsWith("event: ")) {
                        const eventType = line.slice(7);
                        const nextLine = lines[lines.indexOf(line) + 1];
                        if (nextLine?.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(nextLine.slice(6));
                                const event: AgentEvent = { type: eventType as AgentEvent["type"], data };
                                setEvents((prev) => [...prev, event]);

                                if (eventType === "complete" && data.image) {
                                    setFinalImage(data.image);
                                }
                            } catch {
                                // Skip malformed JSON
                            }
                        }
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
    }, [prompt, constitution, elements]);

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
                <Link
                    href="/canvas"
                    className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all flex items-center gap-2"
                >
                    <span>🎨</span>
                    <span>Canvas</span>
                </Link>
            </header>

            <main className="flex-1 p-6 max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-6">
                {/* Left: Input & Controls */}
                <div className="space-y-6">
                    {/* Constitution Status */}
                    <div className="glass-card rounded-xl p-4">
                        {constitution ? (
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">✅</span>
                                <div>
                                    <h3 className="font-semibold text-primary">Brand Constitution Active</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {constitution.visual_identity.color_palette_hex.length} colors configured
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
                            <span>📡</span>
                            <span>Agent Activity</span>
                            {isRunning && (
                                <span className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse" />
                            )}
                        </h3>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {events.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-6">
                                    Agent activity will appear here...
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
                                            <p className="text-muted-foreground">{event.data.thinking}</p>
                                        )}
                                        {event.data.tool && (
                                            <p className="text-primary font-mono text-xs mt-1">
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

                {/* Right: Generated Image */}
                <div className="glass-card rounded-2xl p-6 flex flex-col">
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
                        ) : finalImage ? (
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

                    {finalImage && (
                        <div className="mt-4 flex gap-3">
                            <button
                                className="flex-1 px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all"
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = `data:image/png;base64,${finalImage}`;
                                    link.download = "sentient-asset.png";
                                    link.click();
                                }}
                            >
                                💾 Download
                            </button>
                            <button
                                className="flex-1 px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all"
                                onClick={() => setFinalImage(null)}
                            >
                                🔄 Clear
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
