"use client";

import { useEffect, useState } from "react";
import { useCanvasStore } from "@/lib/store/canvasStore";
import { CanvasBoard } from "@/components/canvas/CanvasBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Trash2,
    Plus,
    Type,
    Image as ImageIcon,
    Palette,
    Brain,
    Loader2,
    LayoutTemplate,
} from "lucide-react";
import { CanvasElement, Brand, BrandConstitution, createCanvasElement, CanvasElementType } from "@/lib/types";
import {
    getAllBrands,
    createBrand,
    saveConstitution,
    getConstitution,
    getBrand,
} from "@/lib/firebase/firestore";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ShimmerButton from "@/components/magicui/shimmer-button";
import { AddImageDialog } from "@/components/canvas/AddImageDialog";
import { AddColorDialog } from "@/components/canvas/AddColorDialog";
import { ComplianceOverlay } from "@/components/editor/ComplianceOverlay";
import html2canvas from "html2canvas";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function CanvasPage() {
    const {
        elements,
        addElement: addElementToStore, // Rename to avoid conflict
        removeElement,
        selectedElementId,
        selectElement,
        setElements,
        constitution,
        setConstitution,
        currentBrand,
        setCurrentBrand,
        canvasSettings,
        setCanvasSettings,
    } = useCanvasStore();

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [constitutionOpen, setConstitutionOpen] = useState(false);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<string>("");
    const [newBrandName, setNewBrandName] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
    
    // Compliance State
    const [isAuditing, setIsAuditing] = useState(false);
    const [showComplianceOverlay, setShowComplianceOverlay] = useState(false);
    const [complianceIssues, setComplianceIssues] = useState<any[]>([]);
    const [complianceScore, setComplianceScore] = useState<number | null>(null);

    useEffect(() => {
        loadBrands();
    }, []);

    async function loadBrands() {
        try {
            const data = await getAllBrands();
            setBrands(data);
        } catch (error) {
            console.error("Failed to load brands:", error);
        }
    }

    async function handleCreateBrand() {
        if (!newBrandName.trim()) return;
        try {
            // @ts-ignore - ID is auto-generated
            const newId = await createBrand({
                name: newBrandName,
                canvas_elements: [],
                constitution_cache: null,
                processed_assets: {},
                // process_assets is required by type but likely handled in firestore.ts or optional
            });
            setNewBrandName("");
            setCreateDialogOpen(false);
            loadBrands();
            handleBrandSelect(newId);
        } catch (error) {
            console.error("Failed to create brand FULL ERROR:", error);
            alert(`Failed to create brand: ${(error as Error).message}`);
        }
    }

    async function handleBrandSelect(id: string) {
        setSelectedBrandId(id);

        try {
            const brand = await getBrand(id);
            if (brand) {
                setCurrentBrand(brand);

                // Load constitution specifically if needed, though setCurrentBrand handles it
                if (brand.constitution_cache) {
                    setConstitution(brand.constitution_cache);
                }

                setElements(brand.canvas_elements || []);
            }
        } catch (error) {
            console.error("Failed to select brand:", error);
        }
    }

    function handleAddElement(type: CanvasElementType) {
        // Calculate center position based on window (approximate)
        const x = window.innerWidth / 2 - 100 + (Math.random() * 50 - 25);
        const y = window.innerHeight / 2 - 100 + (Math.random() * 50 - 25);

        const newEl = createCanvasElement(type, {
            x,
            y,
            text: type === 'text' ? 'New Text' : (type === 'note' ? 'New Note' : undefined),
            color: type === 'color' ? '#3b82f6' : (type === 'note' ? '#facc15' : undefined), // Default Blue for color, Yellow for note
        });

        addElementToStore(newEl);
    }

    async function handleAnalyze() {
        if (elements.length === 0) return;

        setIsAnalyzing(true);
        try {
            const response = await fetch("/api/agent/constitution", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    elements, 
                    settings: canvasSettings // Send the Frame/Aspect Ratio data
                }),
            });

            if (!response.ok) throw new Error("Analysis failed");

            const data = await response.json();
            if (data.constitution) {
                setConstitution(data.constitution);
                setConstitutionOpen(true);

                if (currentBrand?.id) {
                    await saveConstitution(currentBrand.id, data.constitution);
                }
            }
        } catch (error) {
            console.error("Analysis failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    }

    async function handleAudit() {
        if (!constitution) {
            alert("No constitution found. Please analyze the brand first.");
            return;
        }

        setIsAuditing(true);
        setShowComplianceOverlay(false); // Reset overlay while auditing
        
        try {
            // Capture the canvas area
            const canvasElement = document.getElementById("canvas-board-area");
            if (!canvasElement) throw new Error("Canvas element not found");

            const canvas = await html2canvas(canvasElement, {
                backgroundColor: null, // Transparent background if possible
                scale: 1, // 1:1 scale for speed
                logging: false,
                useCORS: true, // Important for external images
            });

            const imageBase64 = canvas.toDataURL("image/png");

            // Call Audit API
            const response = await fetch("/api/agent/audit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64,
                    constitution
                }),
            });

            const result = await response.json();

            if (result.error) throw new Error(result.error);

            setComplianceIssues(result.heatmap_coordinates || []);
            setComplianceScore(result.compliance_score);
            setShowComplianceOverlay(true);

        } catch (error) {
            console.error("Audit failed:", error);
            alert("Audit failed. See console for details.");
        } finally {
            setIsAuditing(false);
        }
    }

    // Tools Configuration
    const tools = [
        { id: "text", icon: Type, label: "Add Text", action: () => handleAddElement("text") },
        { id: "image", icon: ImageIcon, label: "Add Image", action: () => setIsImageDialogOpen(true) },
        { id: "note", icon: LayoutTemplate, label: "Add Note", action: () => handleAddElement("note") },
        { id: "color", icon: Palette, label: "Add Color", action: () => setIsColorDialogOpen(true) },
    ];

    return (
        <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col relative group/canvas">
            
            {/* ... Background ... */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px] pointer-events-none" />
            <div className="absolute inset-0 bg-background/50 pointer-events-none radial-mask" />

            {/* HEADER - Floating Island */}
            <motion.header 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none"
            >
                {/* ... Header Content ... */}
                <div className="glass px-6 py-3 rounded-2xl flex items-center gap-6 shadow-2xl pointer-events-auto border-white/10 backdrop-blur-xl">
                    <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <span className="text-xl">✨</span>
                        <span className="font-bold tracking-tight hidden md:inline">Sentient Canvas</span>
                    </Link>

                    <div className="h-6 w-px bg-white/10" />

                    {/* Brand Selector */}
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                         <div className="flex items-center gap-2">
                            <select 
                                value={selectedBrandId}
                                onChange={(e) => handleBrandSelect(e.target.value)}
                                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer max-w-[150px] truncate"
                            >
                                <option value="" disabled>Select Brand</option>
                                {brands.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10" tabIndex={-1}>
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </DialogTrigger>
                        </div>
                         <DialogContent className="glass border-white/10 text-foreground">
                            <DialogHeader>
                                <DialogTitle>Create New Brand</DialogTitle>
                                <DialogDescription>Start a fresh brand identity.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input
                                    id="name"
                                    value={newBrandName}
                                    onChange={(e) => setNewBrandName(e.target.value)}
                                    className="col-span-3 bg-black/50 border-white/10 mt-2"
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateBrand}>Create Brand</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <div className="h-6 w-px bg-white/10" />

                     {/* Layout Selector */}
                     <select
                        value={canvasSettings?.preset || 'free'}
                        onChange={(e) => setCanvasSettings({ ...canvasSettings, preset: e.target.value as any, name: e.target.options[e.target.selectedIndex].text })}
                        className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer max-w-[150px] truncate"
                    >
                        <option value="free" className="text-black bg-white">Free Canvas</option>
                        <option value="1:1" className="text-black bg-white">Post (1:1)</option>
                        <option value="9:16" className="text-black bg-white">Story (9:16)</option>
                        <option value="16:9" className="text-black bg-white">Landscape</option>
                    </select>

                    <div className="h-6 w-px bg-white/10" />
                    
                    {/* Status Indicator */}
                     <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <span className={`w-1.5 h-1.5 rounded-full ${currentBrand ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : "bg-yellow-500"}`} />
                        {currentBrand ? "SYNCED" : "LOCAL"}
                    </div>
                </div>
            </motion.header>

            {/* FLOATING TOOLBAR */}
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 glass px-4 py-3 rounded-full flex items-center gap-3 shadow-2xl border-white/10 backdrop-blur-xl hover:scale-105 transition-transform duration-300"
            >
                <TooltipProvider delayDuration={300} disableHoverableContent>
                    {tools.map((tool) => (
                        <Tooltip key={tool.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => { 
                                        e.preventDefault();
                                        tool.action(); 
                                    }}
                                    className="rounded-full hover:bg-white/10 hover:text-primary transition-all active:scale-95 focus:outline-none focus:ring-0"
                                >
                                    <tool.icon className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-black/90 text-white border-white/10">
                                <p>{tool.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    
                    <div className="h-8 w-px bg-white/10 mx-2" />
                    
                     {selectedElementId && (
                         <Tooltip>
                            <TooltipTrigger asChild onPointerDown={(e) => e.preventDefault()}>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => removeElement(selectedElementId)}
                                    className="rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-red-900 border-red-500/50">
                                <p>Delete Selected</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    <Tooltip>
                         <TooltipTrigger asChild onPointerDown={(e) => e.preventDefault()}>
                             <div className="ml-2 flex gap-2">
                                {/* AUDIT BUTTON */}
                                <ShimmerButton 
                                    onClick={handleAudit} 
                                    className="h-10 px-4 rounded-full"
                                    disabled={elements.length === 0 || isAuditing}
                                    shimmerColor={isAuditing ? "#ef4444" : "#ff0000"} // Red shimmer for audit
                                    background={isAuditing ? "rgba(239, 68, 68, 0.2)" : "rgba(0,0,0,0.8)"}
                                >
                                    {isAuditing ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-500/80 hover:text-red-500">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>Audit</span>
                                        </div>
                                    )}
                                </ShimmerButton>

                                {/* ANALYZE BUTTON */}
                                <ShimmerButton 
                                    onClick={handleAnalyze} 
                                    className="h-10 px-6 rounded-full"
                                    disabled={elements.length === 0 || isAnalyzing}
                                    shimmerColor={isAnalyzing ? "#ff00ff" : "#ffffff"}
                                >
                                    {isAnalyzing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Brain className="h-4 w-4" />
                                            <span>Analyze</span>
                                        </div>
                                    )}
                                </ShimmerButton>
                             </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>Generate Constitution & Audit</p>
                        </TooltipContent>
                    </Tooltip>

                </TooltipProvider>
            </motion.div>

            {/* COMPLIANCE ALERT - Floating Top Center when issues found */}
            <AnimatePresence>
                {showComplianceOverlay && complianceScore !== null && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                        <div className={`
                            glass px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl border 
                            ${complianceScore >= 90 ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}
                            backdrop-blur-xl pointer-events-auto cursor-pointer hover:scale-105 transition-transform
                        `}
                        onClick={() => setShowComplianceOverlay(!showComplianceOverlay)}
                        >
                            {complianceScore >= 90 ? (
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-500 rounded-full p-1">
                                        <CheckCircle2 className="w-5 h-5 text-black" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-green-400">PASSED: {complianceScore}%</span>
                                        <span className="text-[10px] text-green-300/70 uppercase tracking-wider">Brand Constituiton Verified</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-500 rounded-full p-1 animate-pulse">
                                        <AlertTriangle className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-red-400">VIOLATION: {complianceScore}%</span>
                                        <span className="text-[10px] text-red-300/70 uppercase tracking-wider">{complianceIssues.length} Issues Detected</span>
                                    </div>
                                </div>
                            )}
                            
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 rounded-full hover:bg-white/10 ml-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowComplianceOverlay(false);
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN CANVAS AREA */}
            <div 
                id="canvas-board-area" // ID for html2canvas
                className="flex-1 relative cursor-crosshair active:cursor-grabbing"
                onClick={() => selectElement(null)} 
            >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                     <span className="text-[10rem] font-bold text-white/5 select-none user-select-none">
                        SENTIENT
                     </span>
                </div>
                
                <CanvasBoard /> 

                {/* COMPLIANCE OVERLAY LAYER */}
                <ComplianceOverlay 
                    issues={complianceIssues}
                    isVisible={showComplianceOverlay && complianceIssues.length > 0}
                    onClose={() => setShowComplianceOverlay(false)}
                />
            </div>

            {/* CONSTITUTION DRAWER */}
            <AnimatePresence>
                {constitutionOpen && constitution && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute top-0 right-0 w-[400px] h-full z-40 glass border-l border-white/10 shadow-2xl overflow-y-auto"
                    >
                        {/* ... Drawer Content ... */}
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2 neon-text">
                                    <span className="text-2xl">📜</span> Constitution
                                </h2>
                                <Button variant="ghost" size="icon" onClick={() => setConstitutionOpen(false)}>
                                    <Trash2 className="h-4 w-4 rotate-45" /> 
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {/* Vibe Section */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-mono text-muted-foreground uppercase">Core Vibe</Label>
                                    <div className="p-3 bg-black/40 rounded-lg border border-white/5 text-sm italic">
                                        "{constitution.visual_identity.style_description}"
                                    </div>
                                </div>

                                {/* Colors */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-mono text-muted-foreground uppercase">Palette</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {constitution.visual_identity.color_palette_hex.map((color: string, i: number) => (
                                            <div key={i} className="group relative">
                                                <div 
                                                    className="w-10 h-10 rounded-full border border-white/20 shadow-lg transition-transform hover:scale-110 cursor-pointer"
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => navigator.clipboard.writeText(color)}
                                                />
                                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1 rounded">
                                                    {color}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Keywords */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-mono text-muted-foreground uppercase">Keywords</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {constitution.voice.keywords.map((word: string, i: number) => (
                                            <span key={i} className="px-2 py-1 rounded-md bg-white/5 text-xs text-white/80 border border-white/5">
                                                #{word}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* NEW ACTIONS DIALOGS */}
            <AddImageDialog 
                open={isImageDialogOpen} 
                onOpenChange={setIsImageDialogOpen} 
                onAddImage={(url) => addElementToStore(createCanvasElement("image", { url, x: 150, y: 150 }))} 
            />
            <AddColorDialog 
                open={isColorDialogOpen} 
                onOpenChange={setIsColorDialogOpen} 
                onAddColor={(color) => addElementToStore(createCanvasElement("color", { color, x: 250, y: 250 }))} 
            />

        </div>
    );
}
