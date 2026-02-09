"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasStore } from "@/lib/store/canvasStore";
import { getConstitution, saveConstitution, addCanvasElement } from "@/lib/firebase/firestore";
import type { AgentAction } from "@/lib/ai/tools";
import { EditableCanvas } from "@/components/editor";
import { createCanvasElement } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/magicui/border-beam";
import ShimmerButton from "@/components/magicui/shimmer-button";
import { Copy, RefreshCw, Download, Zap, History, LayoutGrid, Terminal } from "lucide-react";

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
        imageId?: string; // Added imageId
        constitution?: any; // Added constitution
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
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [events]);

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
    }, [prompt, constitution, elements, currentBrand?.id, addElement, setConstitution]);

    const stopAgent = () => {
        abortRef.current?.abort();
        setIsRunning(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
            {/* Header */}
            <header className="border-b border-border/40 px-6 py-4 flex items-center justify-between bg-background/50 backdrop-blur-xl sticky top-0 z-50">
                 <div className="flex items-center gap-4">
                    <Link href="/" className="text-xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
                        Sentient <span className="text-primary">Studio</span>
                    </Link>
                    <span className="text-muted-foreground/30 font-light">|</span>
                    <span className="text-sm font-mono text-muted-foreground bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        CMD_CENTER_v2.0
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="gap-2 text-muted-foreground hover:text-white">
                        <History className="w-4 h-4" />
                        Log
                    </Button>
                    <Link href="/canvas">
                        <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:border-primary/50 bg-primary/5">
                            <LayoutGrid className="w-4 h-4 text-primary" />
                            Canvas
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full grid lg:grid-cols-12 gap-8">
                
                {/* Left Column: Command & Logs (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    {/* Status Card */}
                    <Card className="relative overflow-hidden border-border/50 bg-card/50">
                        <CardHeader className="pb-2">
                             <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">System Status</CardTitle>
                                <span className={`w-2 h-2 rounded-full ${constitution ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-yellow-500 animate-pulse"}`} />
                             </div>
                        </CardHeader>
                        <CardContent>
                             {constitution ? (
                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-white tracking-tight">Memory Active</div>
                                    <p className="text-xs text-muted-foreground font-mono">
                                        {constitution.visual_identity.color_palette_hex.length} TOKENS EXTRACTED
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-xl font-bold text-white">Awaiting Input</div>
                                    <Link href="/canvas" className="text-xs text-primary hover:underline font-mono mt-1 block">
                                        Initialize via Canvas {">"}
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Command Output Interface */}
                     <Card className="flex-1 min-h-[500px] border-border/50 bg-black/40 backdrop-blur-md flex flex-col relative overflow-hidden group">
                        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                        <CardHeader className="py-3 px-4 border-b border-white/5 bg-white/5 flex flex-row items-center gap-2">
                             <Terminal className="w-4 h-4 text-primary" />
                             <span className="text-xs font-mono text-muted-foreground">AGI_PROCESS_LOG</span>
                        </CardHeader>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm relative z-10 scrollbar-none">
                            <AnimatePresence mode="popLayout">
                                {events.length === 0 ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }}
                                        className="text-muted-foreground/50 text-center py-20"
                                    >
                                        [SYSTEM READY]
                                        <br/>
                                        Waiting for prompt execution...
                                    </motion.div>
                                ) : (
                                    events.map((event, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`p-3 rounded border-l-2 ${
                                                event.type === "error" ? "border-red-500 bg-red-500/10" :
                                                event.type === "complete" ? "border-green-500 bg-green-500/10" :
                                                "border-primary/50 bg-primary/5"
                                            }`}
                                        >
                                           {event.data.thinking && (
                                                <div className="text-xs text-muted-foreground mb-1 flex items-start gap-2">
                                                    <span className="text-primary mt-0.5 opacity-50">{">"}</span>
                                                    <span className="italic opacity-80">{event.data.thinking}</span>
                                                </div>
                                            )}
                                            {event.data.tool && (
                                                <div className="text-xs font-bold text-primary mb-1">
                                                    EXEC: {event.data.tool}()
                                                </div>
                                            )}
                                            {event.data.message && (
                                                <div className={event.type === "complete" ? "text-green-400" : "text-white/80"}>
                                                    {event.data.message}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                             <div ref={chatEndRef} />
                        </div>

                         {/* Input Area */}
                         <div className="p-4 bg-background/50 border-t border-white/10 z-20">
                            {error && (
                                <div className="text-red-400 text-xs mb-2 flex items-center gap-1 font-mono">
                                    <span className="inline-block w-2 h-2 bg-red-400 rounded-full" />
                                    ERROR: {error}
                                </div>
                            )}
                            <div className="relative">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Enter directive (e.g., 'Generate diverse thumbnails')..."
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm focus:ring-1 focus:ring-primary outline-none resize-none h-24 font-mono transition-all focus:border-primary/50 disabled:opacity-50"
                                    disabled={isRunning}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            runAgent();
                                        }
                                    }}
                                />
                                <div className="absolute bottom-3 right-3 flex gap-2">
                                     <button
                                        onClick={isRunning ? stopAgent : runAgent}
                                        disabled={!prompt.trim() && !isRunning}
                                        className={`p-2 rounded-md transition-all ${
                                            isRunning 
                                            ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" 
                                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                                        }`}
                                    >
                                        {isRunning ? <span className="animate-pulse">🛑</span> : <Zap className="w-4 h-4 fill-current" />}
                                    </button>
                                </div>
                            </div>
                         </div>
                    </Card>

                </div>

                {/* Right Column: Output Visualization (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6 h-full min-h-[600px]">
                    <Card className="flex-1 relative overflow-hidden border-border/50 bg-black/40 backdrop-blur-xl flex flex-col items-center justify-center group">
                        <BorderBeam size={600} duration={20} delay={0} colorFrom="#00FFFF" colorTo="#FF00FF" />
                        
                        <div className="relative w-full h-full flex flex-col p-8">
                             <div className="flex-1 flex items-center justify-center relative">
                                {isRunning && !finalImage ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative w-24 h-24">
                                            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                                            <div className="absolute inset-2 rounded-full border-r-2 border-accent animate-spin-reverse opacity-70" />
                                        </div>
                                        <div className="text-primary font-mono text-sm animate-pulse tracking-widest">
                                            COMPUTING...
                                        </div>
                                    </div>
                                    ) : finalImage ? (
                                    <motion.div 
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="relative w-full h-full max-h-[600px] shadow-2xl rounded-lg overflow-hidden border border-white/10"
                                    >
                                        <Image
                                            src={`data:image/png;base64,${finalImage}`}
                                            alt="Generated asset"
                                            fill
                                            className="object-contain"
                                        />
                                    </motion.div>
                                ) : (
                                    <div className="text-center space-y-4 opacity-50">
                                        <div className="w-32 h-32 rounded-full bg-white/5 mx-auto flex items-center justify-center border border-white/10">
                                            <LayoutGrid className="w-12 h-12 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-mono text-sm max-w-sm mx-auto">
                                            [VISUAL OUTPUT BUFFER EMPTY]
                                        </p>
                                    </div>
                                )}
                             </div>
                             
                             {/* Actions Bar */}
                             {finalImage && finalImage !== "PLACEHOLDER_IMAGE_BASE64" && (
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="pt-6 flex justify-center gap-4"
                                >
                                    <Button onClick={() => setShowEditor(true)} className="gap-2 shadow-lg shadow-primary/20">
                                        <RefreshCw className="w-4 h-4" />
                                        Refine in Canvas
                                    </Button>
                                    <Button variant="secondary" onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = `data:image/png;base64,${finalImage}`;
                                        link.download = "sentient-asset.png";
                                        link.click();
                                    }} className="gap-2">
                                        <Download className="w-4 h-4" />
                                        Save Asset
                                    </Button>
                                </motion.div>
                             )}
                        </div>
                    </Card>
                </div>

            </main>

            {/* Canvas Editor Modal */}
            <AnimatePresence>
                {showEditor && finalImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <div className="w-full max-w-7xl h-[90vh] bg-background border border-border/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <span className="text-xl">✨</span>
                                    <span>Fine-Tune</span>
                                </h2>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowEditor(false)}
                                    className="hover:bg-red-500/10 hover:text-red-500"
                                >
                                    ✕ Close
                                </Button>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <EditableCanvas
                                    imageBase64={finalImage}
                                    onSave={(dataUrl) => {
                                        const base64 = dataUrl.split(",")[1];
                                        if (base64) setFinalImage(base64);
                                        setShowEditor(false);
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
