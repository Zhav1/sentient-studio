"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCanvasStore } from "@/lib/store/canvasStore";
import { createCanvasElement } from "@/lib/types";

// Element Components
const CanvasImage = ({ element, isSelected, onClick }: any) => (
    <motion.div
        layoutId={element.id}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative group ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-black" : ""}`}
        style={{ 
            position: 'absolute', 
            left: element.x, 
            top: element.y,
            width: element.width || 200,
            cursor: 'grab'
        }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        drag
        dragMomentum={false}
    >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
            src={element.url} 
            alt={element.name} 
            className="rounded-lg shadow-2xl pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
    </motion.div>
);

const CanvasText = ({ element, isSelected, onClick }: any) => (
    <motion.div
        layoutId={element.id}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`absolute p-2 cursor-grab ${isSelected ? "border border-primary" : "border border-transparent hover:border-white/20"}`}
        style={{ left: element.x, top: element.y }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        drag
        dragMomentum={false}
    >
        <h3 className="text-4xl font-black text-white drop-shadow-lg tracking-tight" style={{ fontFamily: 'Inter' }}>
            {element.text}
        </h3>
    </motion.div>
);

const CanvasNote = ({ element, isSelected, onClick }: any) => (
    <motion.div
        layoutId={element.id}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`absolute w-64 p-4 rounded-xl bg-yellow-400/10 backdrop-blur-md border border-yellow-400/20 shadow-xl cursor-grab ${isSelected ? "ring-2 ring-yellow-400" : ""}`}
        style={{ left: element.x, top: element.y }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        drag
        dragMomentum={false}
    >
        <p className="font-mono text-sm text-yellow-100/90">{element.text}</p>
    </motion.div>
);

const CanvasColor = ({ element, isSelected, onClick }: any) => (
    <motion.div
        layoutId={element.id}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`absolute w-24 h-24 rounded-full shadow-2xl cursor-grab ${isSelected ? "ring-4 ring-white" : ""}`}
        style={{ left: element.x, top: element.y, backgroundColor: element.color }}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        drag
        dragMomentum={false}
    >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="bg-black/80 text-white text-[10px] font-mono px-2 py-1 rounded">
                {element.color}
            </span>
        </div>
    </motion.div>
);

export function CanvasBoard() {
    const { elements, selectElement, selectedElementId, addElement, updateElement } = useCanvasStore();
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
            className="w-full h-full relative overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <AnimatePresence>
                {elements.map(el => {
                    const props = {
                        key: el.id,
                        element: el,
                        isSelected: selectedElementId === el.id,
                        onClick: () => selectElement(el.id)
                    };

                    if (el.type === 'image') return <CanvasImage {...props} />;
                    if (el.type === 'text') return <CanvasText {...props} />;
                    if (el.type === 'note') return <CanvasNote {...props} />;
                    if (el.type === 'color') return <CanvasColor {...props} />;
                    return null;
                })}
            </AnimatePresence>
        </div>
    );
}
