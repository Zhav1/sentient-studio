"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasStore } from "@/lib/store/canvasStore";
import { createCanvasElement } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Trash2, X, MoveHorizontal, MoveVertical, Layers, ArrowUpFromLine, ArrowDownFromLine } from "lucide-react"; // Import icons

const CanvasToolbar = ({ element, updateElement, onDelete, onReorder }: any) => {
    return (
        <div 
            className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/80 backdrop-blur-md p-1.5 rounded-lg border border-white/10 shadow-xl z-[60] no-drag"
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking toolbar
        >
            {/* Color Picker for Note, Color, AND Text elements */}
            {(element.type === 'note' || element.type === 'color' || element.type === 'text') && (
                <div className="flex gap-1 mr-2 border-r border-white/10 pr-2">
                    {['#ffffff', '#000000', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map(color => (
                        <div
                            key={color}
                            className="w-4 h-4 rounded-full cursor-pointer hover:scale-125 transition-transform border border-white/20"
                            style={{ backgroundColor: color }}
                            onClick={() => updateElement(element.id, { color })}
                        />
                    ))}
                </div>
            )}

            {/* Font Size for Text */}
            {element.type === 'text' && (
                 <div className="flex items-center gap-1 mr-2 border-r border-white/10 pr-2">
                    <button 
                        onClick={() => updateElement(element.id, { fontSize: Math.max(12, (element.fontSize || 40) - 4) })}
                        className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded"
                    >
                        -
                    </button>
                    <span className="text-xs font-mono text-white w-4 text-center">{element.fontSize || 40}</span>
                    <button 
                         onClick={() => updateElement(element.id, { fontSize: Math.min(200, (element.fontSize || 40) + 4) })}
                         className="w-6 h-6 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded"
                    >
                        +
                    </button>
                 </div>
            )}

            {/* Layer Controls */}
            <div className="flex items-center gap-1 mr-2 border-r border-white/10 pr-2">
                <button 
                    onClick={() => onReorder('front')}
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    title="Bring to Front"
                >
                    <ArrowUpFromLine className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => onReorder('back')}
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    title="Send to Back"
                >
                    <ArrowDownFromLine className="w-4 h-4" />
                </button>
            </div>

            <button 
                onClick={onDelete}
                className="p-1.5 text-red-400 hover:text-red-200 hover:bg-red-500/20 rounded-md transition-colors"
                title="Delete"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
};

// ... (DraggableElement remains mostly the same, just passing onReorder)

// --- Draggable Wrapper ---
const DraggableElement = ({ element, isSelected, onSelect, updateElementPosition, updateElement, removeElement, reorderElement, children }: any) => {
    // ... (state and handlers same as before)
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    
    // Drag State
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const pointerStartRef = useRef<{ x: number, y: number } | null>(null);
    const elementStartRef = useRef<{ x: number, y: number } | null>(null);

    // Resize State
    const [resizeOffset, setResizeOffset] = useState({ w: 0, h: 0 });
    const resizeStartRef = useRef<{ w: number, h: number } | null>(null);

    // --- DRAG HANDLERS ---
    const handlePointerDown = (e: React.PointerEvent) => {
        const target = e.target as HTMLElement;
        
        // CRITICAL: Stop propagation immediately to prevent background deselect
        e.stopPropagation(); 
        onSelect();

        // Prevent drag if interacting with toolbar, inputs, or handles
        if (
            target.tagName === 'TEXTAREA' || 
            target.tagName === 'INPUT' || 
            target.closest('.no-drag') || 
            target.dataset.type === 'resize-handle'
        ) {
            return;
        }

        e.preventDefault(); // Prevent text selection/native drag
        
        setIsDragging(true);
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
        elementStartRef.current = { x: element.x, y: element.y };
        setDragOffset({ x: 0, y: 0 });
        target.setPointerCapture(e.pointerId);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect();
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !pointerStartRef.current || !elementStartRef.current) return;
        e.preventDefault();
        const dx = e.clientX - pointerStartRef.current.x;
        const dy = e.clientY - pointerStartRef.current.y;
        setDragOffset({ x: dx, y: dy });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging || !pointerStartRef.current || !elementStartRef.current) return;
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        const dx = e.clientX - pointerStartRef.current.x;
        const dy = e.clientY - pointerStartRef.current.y;
        updateElementPosition(element.id, elementStartRef.current.x + dx, elementStartRef.current.y + dy);
        setDragOffset({ x: 0, y: 0 });
        pointerStartRef.current = null;
        elementStartRef.current = null;
    };

    // --- RESIZE HANDLERS ---
    const handleResizeDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation(); 
        setIsResizing(true);
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
        resizeStartRef.current = { w: element.width || 300, h: element.height || 300 };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handleResizeMove = (e: React.PointerEvent) => {
        if (!isResizing || !pointerStartRef.current || !resizeStartRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const dx = e.clientX - pointerStartRef.current.x;
        const dy = e.clientY - pointerStartRef.current.y;
        setResizeOffset({ w: dx, h: dy });
    };

    const handleResizeUp = (e: React.PointerEvent) => {
        if (!isResizing || !pointerStartRef.current || !resizeStartRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        const dx = e.clientX - pointerStartRef.current.x;
        const dy = e.clientY - pointerStartRef.current.y;
        
        const newWidth = Math.max(50, resizeStartRef.current.w + dx);
        const newHeight = Math.max(50, resizeStartRef.current.h + dy);
        
        updateElement(element.id, { width: newWidth, height: newHeight }); 
        setResizeOffset({ w: 0, h: 0 });
        pointerStartRef.current = null;
        resizeStartRef.current = null;
    };

    // Derived Values
    const currentX = element.x + dragOffset.x;
    const currentY = element.y + dragOffset.y;
    const currentWidth = (element.width || (element.type === 'image' ? 300 : 250)) + resizeOffset.w;
    const currentHeight = (element.height || (element.type === 'image' ? 200 : 100)) + resizeOffset.h; 

    return (
        <motion.div
            layout={false}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
                "absolute group",
                isSelected ? "z-[50]" : "z-10", 
                isDragging && "z-[60] scale-[1.01] shadow-2xl cursor-grabbing",
                !isDragging && "cursor-grab"
            )}
            style={{ 
                left: currentX, 
                top: currentY,
                width: currentWidth,
                height: currentHeight,
                touchAction: 'none'
            }}
            onPointerDown={handlePointerDown}
            onContextMenu={handleContextMenu}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={(e) => e.stopPropagation()} // Stop click bubbling just in case
        >
            {/* Toolbar - ALWAYS SHOW if selected, even during drag */}
            {isSelected && !isResizing && (
                <CanvasToolbar 
                    element={element} 
                    updateElement={updateElement} 
                    onDelete={() => removeElement(element.id)}
                    onReorder={(dir: 'front' | 'back') => reorderElement(element.id, dir)}
                />
            )}

            {children(isDragging)}

            {/* Controls Layer */}
            {isSelected && (
                <>
                    {/* Border */}
                    <div className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none z-10" />
                    
                    {/* Resize Handle - Bottom Right */}
                    <div 
                        data-type="resize-handle"
                        className="absolute -bottom-3 -right-3 w-8 h-8 flex items-center justify-center cursor-nwse-resize z-[70] group/handle"
                        onPointerDown={handleResizeDown}
                        onPointerMove={handleResizeMove}
                        onPointerUp={handleResizeUp}
                    >
                        <div className="w-4 h-4 bg-white rounded-full border-2 border-primary shadow-sm group-hover/handle:scale-125 transition-transform" />
                    </div>

                    {/* Delete Handle - Top Right (Alternative quick action) */}
                    <div 
                        className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-red-600 z-[70] no-drag"
                        onPointerDown={(e) => { e.stopPropagation(); removeElement(element.id); }}
                    >
                       <X className="w-3 h-3" />
                    </div>
                </>
            )}
        </motion.div>
    );
};


// --- Inner Components (Uncontrolled where possible) ---

const CanvasImage = ({ element, isDragging }: any) => (
    <div className={cn(
        "relative w-full h-full rounded-xl overflow-hidden shadow-sm",
        isDragging && "shadow-xl"
    )}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
            src={element.url} 
            alt={element.name} 
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable={false}
        />
    </div>
);

const CanvasText = ({ element, updateElement, isDragging }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    return (
        <div
            className="w-full h-full flex items-center justify-center"
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        >
            {isEditing ? (
                <textarea
                    ref={inputRef}
                    className="w-full h-full bg-transparent text-center resize-none focus:outline-none pointer-events-auto"
                    style={{ 
                        fontFamily: 'Inter', 
                        fontSize: element.fontSize || 40, 
                        fontWeight: 900,
                        color: element.color || '#ffffff',
                        textShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}
                    value={element.text}
                    onChange={(e) => updateElement(element.id, { text: e.target.value })}
                    onBlur={() => setIsEditing(false)}
                    onKeyDown={(e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setIsEditing(false); } }}
                />
            ) : (
                <div 
                    className="w-full h-full flex items-center justify-center text-center select-none pointer-events-none whitespace-pre-wrap break-words"
                    style={{ 
                        fontFamily: 'Inter', 
                        fontSize: element.fontSize || 40, 
                        fontWeight: 900,
                        color: element.color || '#ffffff',
                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))'
                    }}
                >
                    {element.text}
                </div>
            )}
        </div>
    );
};

const CanvasNote = ({ element, updateElement, isSelected }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            // Don't select all text for notes, just focus
        }
    }, [isEditing]);

    return (
        <div
            className={cn(
                "w-full h-full p-6 rounded-xl shadow-lg transition-colors overflow-hidden flex flex-col",
            )}
            style={{ backgroundColor: element.color || '#facc15' }} // Default yellow-400 equivalent
            onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        >
            {isEditing ? (
                <textarea
                    ref={inputRef}
                    className="w-full h-full bg-transparent font-handwriting text-lg text-black/80 focus:outline-none resize-none pointer-events-auto placeholder-black/30"
                    value={element.text}
                    onChange={(e) => updateElement(element.id, { text: e.target.value })}
                    onBlur={() => setIsEditing(false)}
                    placeholder="Type your note..."
                />
            ) : (
                <p className="w-full h-full font-handwriting text-lg text-black/80 whitespace-pre-wrap select-none pointer-events-none break-words overflow-hidden">
                    {element.text || "Double click to edit..."}
                </p>
            )}
        </div>
    );
};

const CanvasColor = ({ element }: any) => (
    <div
        className="w-full h-full rounded-full shadow-xl transition-transform border-4 border-white/20"
        style={{ backgroundColor: element.color }}
    >
       {/* Color is purely visual */}
    </div>
);

export function CanvasBoard() {
    const { elements, selectElement, selectedElementId, addElement, updateElement, updateElementPosition, removeElement, reorderElement, canvasSettings } = useCanvasStore();
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle Drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        
        const rect = containerRef.current?.getBoundingClientRect();
        const x = e.clientX - (rect?.left || 0);
        const y = e.clientY - (rect?.top || 0);

        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        addElement(createCanvasElement("image", {
                            url: event.target.result as string,
                            x, y,
                            name: file.name
                        }));
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    };

    return (
        <div 
            ref={containerRef}
            className="w-full h-full relative overflow-hidden bg-transparent perspective-1000 group/board"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onPointerDown={(e) => {
                // Deselect if clicking the background directly
                if (e.target === containerRef.current || e.target === e.currentTarget) {
                    selectElement(null);
                }
            }}
        >
            {/* ARTBOARD FRAME (if not free) */}
            {canvasSettings?.preset !== 'free' && (
                <div 
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white/20 bg-white/5 pointer-events-none z-0"
                    style={{ 
                        width: canvasSettings.preset === '9:16' ? '337.5px' : (canvasSettings.preset === '16:9' ? '600px' : '500px'),
                        height: canvasSettings.preset === '9:16' ? '600px' : (canvasSettings.preset === '16:9' ? '337.5px' : '500px'),
                        // Scaled down illustrative sizes for the viewport
                    }}
                >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-white/50 font-mono">
                        {canvasSettings.name}
                    </span>
                 </div>
            )}

            <AnimatePresence>
                {elements.map(el => {
                    const isSelected = selectedElementId === el.id;
                    const commonProps = {
                        element: el,
                        isSelected,
                        updateElement
                    };

                    return (
                        <DraggableElement
                            key={el.id}
                            element={el}
                            isSelected={isSelected}
                            onSelect={() => selectElement(el.id)}
                            updateElementPosition={updateElementPosition}
                            updateElement={updateElement}
                            removeElement={removeElement}
                            reorderElement={reorderElement} // Pass reorder function
                        >
                            {(isDragging: boolean) => {
                                const childProps = { ...commonProps, isDragging };
                                if (el.type === 'image') return <CanvasImage {...childProps} />;
                                if (el.type === 'text') return <CanvasText {...childProps} />;
                                if (el.type === 'note') return <CanvasNote {...childProps} />;
                                if (el.type === 'color') return <CanvasColor {...childProps} />;
                                return null;
                            }}
                        </DraggableElement>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
