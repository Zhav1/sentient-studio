"use client";

import { useState, useRef, useEffect } from "react";
import * as fabric from "fabric";
import { Download, FileText, Share2, ChevronDown } from "lucide-react";
import jsPDF from "jspdf";

interface ExportMenuProps {
    fabricCanvas: fabric.Canvas | null;
    imageName?: string;
}

export function ExportMenu({ fabricCanvas, imageName = "sentient-asset" }: ExportMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const showStatus = (msg: string) => {
        setStatusMessage(msg);
        setTimeout(() => setStatusMessage(null), 3000);
    };

    const handlePNGExport = async (scale: number = 2) => {
        if (!fabricCanvas) return;
        setIsExporting(true);
        setIsOpen(false);

        try {
            // Get data URL at higher scale for better quality
            const dataUrl = fabricCanvas.toDataURL({
                format: "png",
                quality: 1,
                multiplier: scale,
            });

            const link = document.createElement("a");
            link.download = `${imageName}-${scale}k.png`;
            link.href = dataUrl;
            link.click();

            showStatus(`PNG exported (${scale}x)`);
        } catch (error) {
            console.error("PNG Export error:", error);
            showStatus("Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const handlePDFExport = async () => {
        if (!fabricCanvas) return;
        setIsExporting(true);
        setIsOpen(false);

        try {
            const dataUrl = fabricCanvas.toDataURL({
                format: "png",
                quality: 1,
                multiplier: 2,
            });

            const pdf = new jsPDF({
                orientation: fabricCanvas.width! > fabricCanvas.height! ? "landscape" : "portrait",
                unit: "px",
                format: [fabricCanvas.width! * 2, fabricCanvas.height! * 2],
            });

            pdf.addImage(dataUrl, "PNG", 0, 0, fabricCanvas.width! * 2, fabricCanvas.height! * 2);
            pdf.save(`${imageName}.pdf`);

            showStatus("PDF exported");
        } catch (error) {
            console.error("PDF Export error:", error);
            showStatus("PDF export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const handleSendToBrandKit = async () => {
        setIsOpen(false);
        showStatus("Coming soon to Brand Kit!");
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 text-sm whitespace-nowrap"
                disabled={isExporting}
            >
                {isExporting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <Download size={18} />
                )}
                Export Asset
                <ChevronDown size={14} className={`opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {statusMessage && (
                <div className="absolute top-full left-0 mt-2 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white z-50 animate-in fade-in slide-in-from-top-1">
                    {statusMessage}
                </div>
            )}

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-white/5 bg-white/5">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-2">Download</span>
                    </div>
                    <div className="p-1">
                        <button
                            onClick={() => handlePNGExport(1)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white rounded-md transition-colors text-left"
                        >
                            <Download size={16} className="text-blue-400" />
                            PNG (Standard)
                        </button>
                        <button
                            onClick={() => handlePNGExport(2)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white rounded-md transition-colors text-left"
                        >
                            <Download size={16} className="text-cyan-400" />
                            PNG (High-Res 2K)
                        </button>
                        <button
                            onClick={() => handlePNGExport(4)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white rounded-md transition-colors text-left"
                        >
                            <Download size={16} className="text-purple-400" />
                            PNG (Ultra-Res 4K)
                        </button>
                    </div>

                    <div className="p-2 border-b border-t border-white/5 bg-white/5">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-2">Document</span>
                    </div>
                    <div className="p-1">
                        <button
                            onClick={handlePDFExport}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white rounded-md transition-colors text-left"
                        >
                            <FileText size={16} className="text-red-400" />
                            Save as PDF
                        </button>
                    </div>

                    <div className="p-2 border-b border-t border-white/5 bg-white/5">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-2">Collaborate</span>
                    </div>
                    <div className="p-1">
                        <button
                            onClick={handleSendToBrandKit}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white rounded-md transition-colors text-left"
                        >
                            <Share2 size={16} className="text-pink-400" />
                            Send to Brand Kit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
