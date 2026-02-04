"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import type { CanvasElement as CanvasElementType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CanvasElementProps {
    element: CanvasElementType;
    isDragging?: boolean;
    onRemove?: () => void;
}

export function CanvasElement({
    element,
    isDragging,
    onRemove,
}: CanvasElementProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: element.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isActive = isDragging || isSortableDragging;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "relative group rounded-xl overflow-hidden cursor-grab active:cursor-grabbing",
                "glass-card transition-all duration-200",
                isActive && "opacity-50 scale-105 z-50",
                "hover:ring-2 hover:ring-primary/50"
            )}
        >
            {/* Image Element */}
            {element.type === "image" && element.url && (
                <div className="aspect-square relative">
                    <Image
                        src={element.url}
                        alt={element.name || "Canvas image"}
                        fill
                        className="object-cover"
                        unoptimized // For blob URLs
                    />
                    {/* Hash indicator */}
                    {element.hash && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs bg-black/70 font-mono">
                            #{element.hash.slice(0, 6)}
                        </div>
                    )}
                </div>
            )}

            {/* Note Element */}
            {element.type === "note" && (
                <div className="p-4 min-h-[120px] flex items-center justify-center bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                    <p className="text-sm text-center">{element.text}</p>
                </div>
            )}

            {/* Color Swatch Element */}
            {element.type === "color" && (
                <div className="aspect-square flex flex-col items-center justify-center p-4">
                    <div
                        className="w-16 h-16 rounded-full ring-2 ring-white/20 shadow-lg mb-2"
                        style={{ backgroundColor: element.color }}
                    />
                    <span className="font-mono text-xs">{element.color}</span>
                </div>
            )}

            {/* Remove Button */}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 text-white 
                     opacity-0 group-hover:opacity-100 transition-opacity
                     flex items-center justify-center text-xs hover:bg-red-500"
                >
                    ✕
                </button>
            )}
        </div>
    );
}
