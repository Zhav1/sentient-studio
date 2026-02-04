"use client";

import { MousePointer2, Type, Square, Circle, Pencil, Trash2, Download } from "lucide-react";

export type EditorTool = "select" | "text" | "rect" | "circle" | "draw";

interface CanvasToolbarProps {
    activeTool: EditorTool;
    onToolChange: (tool: EditorTool) => void;
    onAddText: () => void;
    onAddShape: (shape: "rect" | "circle") => void;
    onDelete: () => void;
    onExport: (format: "png" | "jpeg") => void;
    isDrawing: boolean;
}

/**
 * CanvasToolbar - Tools for manual canvas editing
 */
export function CanvasToolbar({
    activeTool,
    onToolChange,
    onAddText,
    onAddShape,
    onDelete,
    onExport,
}: CanvasToolbarProps) {
    const tools: { id: EditorTool; icon: React.ReactNode; label: string }[] = [
        { id: "select", icon: <MousePointer2 size={18} />, label: "Select" },
        { id: "text", icon: <Type size={18} />, label: "Text" },
        { id: "rect", icon: <Square size={18} />, label: "Rectangle" },
        { id: "circle", icon: <Circle size={18} />, label: "Circle" },
        { id: "draw", icon: <Pencil size={18} />, label: "Draw" },
    ];

    const handleToolClick = (tool: EditorTool) => {
        onToolChange(tool);

        // Trigger actions for additive tools
        if (tool === "text") onAddText();
        if (tool === "rect") onAddShape("rect");
        if (tool === "circle") onAddShape("circle");
    };

    return (
        <div className="flex items-center justify-between bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
            {/* Drawing Tools */}
            <div className="flex items-center gap-1">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.id)}
                        className={`
                            p-2 rounded-md transition-all
                            ${activeTool === tool.id
                                ? "bg-cyan-500/30 text-cyan-400 border border-cyan-500/50"
                                : "text-white/60 hover:text-white hover:bg-white/10"
                            }
                        `}
                        title={tool.label}
                    >
                        {tool.icon}
                    </button>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onDelete}
                    className="p-2 rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete Selected"
                >
                    <Trash2 size={18} />
                </button>

                <div className="w-px h-6 bg-white/10" />

                <button
                    onClick={() => onExport("png")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm"
                >
                    <Download size={16} />
                    Export PNG
                </button>
            </div>
        </div>
    );
}

export default CanvasToolbar;
