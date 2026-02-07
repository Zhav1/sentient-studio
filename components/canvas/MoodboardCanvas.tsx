"use client";

import { useState, useCallback } from "react";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CanvasElement } from "./CanvasElement";
import { DropZone } from "./DropZone";
import { useCanvasStore } from "@/lib/store";
import type { CanvasElement as CanvasElementType } from "@/lib/types";
import { createCanvasElement } from "@/lib/types";
import { calculateFileHash } from "@/lib/utils";

export function MoodboardCanvas() {
    const {
        elements,
        setElements,
        addElement,
        removeElement,
        isAnalyzing,
    } = useCanvasStore();

    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = elements.findIndex((el) => el.id === active.id);
            const newIndex = elements.findIndex((el) => el.id === over.id);
            setElements(arrayMove(elements, oldIndex, newIndex));
        }
    };

    const handleFileDrop = useCallback(
        async (files: File[]) => {
            for (const file of files) {
                // Calculate hash for deduplication
                const hash = await calculateFileHash(file);

                // Check if already on canvas
                const exists = elements.some((el) => el.hash === hash);
                if (exists) {
                    console.log(`File ${file.name} already on canvas (hash: ${hash.slice(0, 8)}...)`);
                    continue;
                }

                // CRITICAL: Convert to base64 data URL (not blob URL!)
                // Blob URLs are session-only and cannot be sent to the server API
                const base64Url = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                // Create canvas element with base64 URL
                const element = createCanvasElement("image", {
                    url: base64Url, // Base64 data URL, NOT blob URL
                    hash,
                    name: file.name,
                    x: Math.random() * 200,
                    y: Math.random() * 200,
                });

                addElement(element);
            }
        },
        [elements, addElement]
    );

    const handleAddNote = useCallback(
        (text: string) => {
            const element = createCanvasElement("note", {
                text,
                x: Math.random() * 200,
                y: Math.random() * 200,
            });
            addElement(element);
        },
        [addElement]
    );

    const handleAddColor = useCallback(
        (color: string) => {
            const element = createCanvasElement("color", {
                color,
                x: Math.random() * 200,
                y: Math.random() * 200,
            });
            addElement(element);
        },
        [addElement]
    );

    const activeElement = elements.find((el) => el.id === activeId);

    return (
        <div className="flex-1 relative">
            {/* Processing Indicator */}
            {isAnalyzing && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full glass neon-glow flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm">AI is analyzing your canvas...</span>
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <DropZone onFileDrop={handleFileDrop}>
                    <SortableContext items={elements} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                            {elements.map((element) => (
                                <CanvasElement
                                    key={element.id}
                                    element={element}
                                    onRemove={() => removeElement(element.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    {/* Empty State */}
                    {elements.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🎨</div>
                                <h3 className="text-xl font-semibold mb-2">Your Canvas Awaits</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Drag and drop images, or use the tools below to add notes and colors.
                                </p>
                            </div>
                        </div>
                    )}
                </DropZone>

                <DragOverlay>
                    {activeElement ? (
                        <CanvasElement element={activeElement} isDragging />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Quick Actions */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                <button
                    onClick={() => {
                        const text = prompt("Enter your note:");
                        if (text) handleAddNote(text);
                    }}
                    className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all flex items-center gap-2"
                >
                    <span>📝</span>
                    <span>Add Note</span>
                </button>
                <button
                    onClick={() => {
                        const color = prompt("Enter a hex color (e.g., #FF00FF):");
                        if (color) handleAddColor(color);
                    }}
                    className="px-4 py-2 rounded-lg glass hover:bg-white/10 transition-all flex items-center gap-2"
                >
                    <span>🎨</span>
                    <span>Add Color</span>
                </button>
            </div>
        </div>
    );
}
