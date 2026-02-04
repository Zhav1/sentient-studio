"use client";

import { useState, useCallback, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
    children: ReactNode;
    onFileDrop: (files: File[]) => void;
    className?: string;
}

export function DropZone({ children, onFileDrop, className }: DropZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const dragCountRef = useRef(0);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCountRef.current++;
        if (e.dataTransfer.types.includes("Files")) {
            setIsDragOver(true);
        }
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCountRef.current--;
        if (dragCountRef.current === 0) {
            setIsDragOver(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCountRef.current = 0;
            setIsDragOver(false);

            const files = Array.from(e.dataTransfer.files).filter((file) =>
                file.type.startsWith("image/")
            );

            if (files.length > 0) {
                onFileDrop(files);
            }
        },
        [onFileDrop]
    );

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
                "min-h-[500px] rounded-2xl border-2 border-dashed border-border transition-all duration-200",
                isDragOver && "border-primary bg-primary/5 drop-zone drag-over",
                className
            )}
        >
            {children}

            {/* Drop Overlay */}
            {isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl z-40 pointer-events-none">
                    <div className="text-center">
                        <div className="text-6xl mb-4 animate-bounce">📥</div>
                        <h3 className="text-xl font-semibold neon-text">Drop to Add</h3>
                        <p className="text-muted-foreground">Release to add images to your canvas</p>
                    </div>
                </div>
            )}
        </div>
    );
}
