"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import { CanvasToolbar, type EditorTool } from "./CanvasToolbar";
import { AIEditPanel } from "./AIEditPanel";

interface EditableCanvasProps {
    imageBase64: string | null;
    onSave?: (dataUrl: string) => void;
    className?: string;
}

/**
 * EditableCanvas - Fabric.js-based interactive canvas editor
 * 
 * Features:
 * - Load generated images as background
 * - Manual tools: text, shapes, draw, crop
 * - AI-assisted editing via natural language
 * - Export to PNG/JPEG
 */
export function EditableCanvas({
    imageBase64,
    onSave,
    className = "",
}: EditableCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const [activeTool, setActiveTool] = useState<EditorTool>("select");
    const [isDrawing, setIsDrawing] = useState(false);
    const [canvasReady, setCanvasReady] = useState(false);

    // Initialize Fabric.js canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        // Create Fabric canvas
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: "#1a1a1a",
            selection: true,
        });

        fabricRef.current = canvas;
        setCanvasReady(true);

        // Cleanup
        return () => {
            canvas.dispose();
            fabricRef.current = null;
        };
    }, []);

    // Load image when imageBase64 changes
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas || !imageBase64) return;

        fabric.Image.fromURL(`data:image/png;base64,${imageBase64}`, {
            crossOrigin: "anonymous",
        }).then((img) => {
            // Calculate scaling to fit canvas
            const scale = Math.min(
                canvas.width! / (img.width || 800),
                canvas.height! / (img.height || 600)
            );

            img.set({
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false,
            });

            // Set as background and center
            canvas.backgroundImage = img;
            canvas.renderAll();
        });
    }, [imageBase64]);

    // Handle tool changes
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        // Reset drawing mode
        canvas.isDrawingMode = false;

        switch (activeTool) {
            case "draw":
                canvas.isDrawingMode = true;
                canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                canvas.freeDrawingBrush.color = "#ffffff";
                canvas.freeDrawingBrush.width = 3;
                setIsDrawing(true);
                break;

            case "select":
            default:
                setIsDrawing(false);
                break;
        }
    }, [activeTool]);

    // Tool action handlers
    const handleAddText = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const text = new fabric.Textbox("Type here...", {
            left: 100,
            top: 100,
            width: 200,
            fontSize: 24,
            fill: "#ffffff",
            fontFamily: "Inter, sans-serif",
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
    }, []);

    const handleAddShape = useCallback((shape: "rect" | "circle") => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        let obj: fabric.Object;

        if (shape === "rect") {
            obj = new fabric.Rect({
                left: 100,
                top: 100,
                width: 100,
                height: 100,
                fill: "rgba(255, 255, 255, 0.3)",
                stroke: "#ffffff",
                strokeWidth: 2,
            });
        } else {
            obj = new fabric.Circle({
                left: 100,
                top: 100,
                radius: 50,
                fill: "rgba(255, 255, 255, 0.3)",
                stroke: "#ffffff",
                strokeWidth: 2,
            });
        }

        canvas.add(obj);
        canvas.setActiveObject(obj);
        canvas.renderAll();
    }, []);

    const handleDelete = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const activeObjects = canvas.getActiveObjects();
        activeObjects.forEach((obj) => canvas.remove(obj));
        canvas.discardActiveObject();
        canvas.renderAll();
    }, []);

    const handleExport = useCallback((format: "png" | "jpeg" = "png") => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL({
            format,
            quality: 1.0,
            multiplier: 2,
        });

        onSave?.(dataUrl);
        return dataUrl;
    }, [onSave]);

    // AI Edit callback - updates canvas with new image
    const handleAIEditComplete = useCallback((newImageBase64: string) => {
        const canvas = fabricRef.current;
        if (!canvas || !newImageBase64) return;

        // Clear existing objects (keep background)
        canvas.getObjects().forEach((obj) => canvas.remove(obj));

        // Load new image as background
        fabric.Image.fromURL(`data:image/png;base64,${newImageBase64}`, {
            crossOrigin: "anonymous",
        }).then((img) => {
            const scale = Math.min(
                canvas.width! / (img.width || 800),
                canvas.height! / (img.height || 600)
            );

            img.set({
                scaleX: scale,
                scaleY: scale,
                selectable: false,
                evented: false,
            });

            canvas.backgroundImage = img;
            canvas.renderAll();
        });
    }, []);

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            {/* Toolbar */}
            <CanvasToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onAddText={handleAddText}
                onAddShape={handleAddShape}
                onDelete={handleDelete}
                onExport={handleExport}
                isDrawing={isDrawing}
            />

            {/* Canvas */}
            <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/50">
                <canvas
                    ref={canvasRef}
                    className="block"
                />
                {!canvasReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <span className="text-white/60">Loading canvas...</span>
                    </div>
                )}
            </div>

            {/* AI Edit Panel */}
            <AIEditPanel
                currentImageBase64={imageBase64}
                onEditComplete={handleAIEditComplete}
            />
        </div>
    );
}

export default EditableCanvas;
