"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import { CanvasToolbar, type EditorTool } from "./CanvasToolbar";
import { AIEditPanel } from "./AIEditPanel";
import { ExportMenu } from "./ExportMenu";

interface EditableCanvasProps {
    imageBase64: string | null;
    onSave?: (dataUrl: string) => void;
    className?: string;
}

/**
 * EditableCanvas - Fabric.js-based interactive canvas editor with mask support
 * 
 * Features:
 * - Load generated images as background
 * - Manual tools: text, shapes, draw
 * - Mask tools: brush, rectangle for region selection
 * - AI-assisted editing with mask-based inpainting
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
    const [maskObjects, setMaskObjects] = useState<fabric.Object[]>([]);

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

            case "mask":
                // Mask brush mode - paint in pink with transparency
                canvas.isDrawingMode = true;
                canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                canvas.freeDrawingBrush.color = "rgba(236, 72, 153, 0.5)"; // Pink mask color
                canvas.freeDrawingBrush.width = 30; // Larger brush for mask
                setIsDrawing(true);
                break;

            case "select":
            case "mask-rect":
            default:
                setIsDrawing(false);
                break;
        }
    }, [activeTool]);

    // Track mask objects from brush strokes
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handlePathCreated = (e: any) => {
            if (activeTool === "mask" && e.path) {
                // Mark as mask object for extraction
                e.path.set("data", { isMask: true });
                setMaskObjects((prev) => [...prev, e.path!]);
            }
        };

        canvas.on("path:created", handlePathCreated);
        return () => {
            canvas.off("path:created", handlePathCreated);
        };
    }, [activeTool]);

    // Handle mask rectangle creation
    useEffect(() => {
        const canvas = fabricRef.current;
        if (!canvas || activeTool !== "mask-rect") return;

        let isCreating = false;
        let startX = 0;
        let startY = 0;
        let rect: fabric.Rect | null = null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleMouseDown = (e: any) => {
            const pointer = e.scenePoint || e.pointer || { x: 0, y: 0 };
            isCreating = true;
            startX = pointer.x;
            startY = pointer.y;

            rect = new fabric.Rect({
                left: startX,
                top: startY,
                width: 0,
                height: 0,
                fill: "rgba(236, 72, 153, 0.3)",
                stroke: "rgba(236, 72, 153, 0.8)",
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: true,
                data: { isMask: true },
            });

            canvas.add(rect);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleMouseMove = (e: any) => {
            if (!isCreating || !rect) return;

            const pointer = e.scenePoint || e.pointer || { x: 0, y: 0 };
            const width = pointer.x - startX;
            const height = pointer.y - startY;

            rect.set({
                width: Math.abs(width),
                height: Math.abs(height),
                left: width < 0 ? pointer.x : startX,
                top: height < 0 ? pointer.y : startY,
            });

            canvas.renderAll();
        };

        const handleMouseUp = () => {
            if (isCreating && rect) {
                setMaskObjects((prev) => [...prev, rect!]);
            }
            isCreating = false;
            rect = null;
        };

        canvas.on("mouse:down", handleMouseDown);
        canvas.on("mouse:move", handleMouseMove);
        canvas.on("mouse:up", handleMouseUp);

        return () => {
            canvas.off("mouse:down", handleMouseDown);
            canvas.off("mouse:move", handleMouseMove);
            canvas.off("mouse:up", handleMouseUp);
        };
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
        activeObjects.forEach((obj) => {
            // Also remove from mask objects if applicable
            if ((obj as fabric.Object & { data?: { isMask?: boolean } }).data?.isMask) {
                setMaskObjects((prev) => prev.filter((m) => m !== obj));
            }
            canvas.remove(obj);
        });
        canvas.discardActiveObject();
        canvas.renderAll();
    }, []);

    const handleClearMask = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        // Remove all mask objects from canvas
        maskObjects.forEach((obj) => canvas.remove(obj));
        setMaskObjects([]);
        canvas.renderAll();
    }, [maskObjects]);

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

    /**
     * Extract mask as a binary (black/white) base64 image
     * White = areas to edit, Black = areas to preserve
     */
    const extractMask = useCallback((): string | null => {
        const canvas = fabricRef.current;
        if (!canvas || maskObjects.length === 0) return null;

        // Create a temporary canvas for mask extraction
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width!;
        tempCanvas.height = canvas.height!;
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) return null;

        // Fill with black (preserve)
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw mask objects in white (edit)
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#ffffff";

        maskObjects.forEach((obj) => {
            const bounds = obj.getBoundingRect();

            if (obj.type === "rect") {
                ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
            } else if (obj.type === "circle") {
                const centerX = bounds.left + bounds.width / 2;
                const centerY = bounds.top + bounds.height / 2;
                const radius = Math.min(bounds.width, bounds.height) / 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (obj.type === "path") {
                // For brush strokes, draw with thick white stroke
                ctx.lineWidth = 30;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";

                // Get the path data and draw
                const path = obj as fabric.Path;
                if (path.path) {
                    ctx.beginPath();
                    path.path.forEach((cmd) => {
                        const command = cmd[0];
                        if (command === "M") {
                            ctx.moveTo((cmd[1] as number) + bounds.left, (cmd[2] as number) + bounds.top);
                        } else if (command === "Q") {
                            ctx.quadraticCurveTo(
                                (cmd[1] as number) + bounds.left,
                                (cmd[2] as number) + bounds.top,
                                (cmd[3] as number) + bounds.left,
                                (cmd[4] as number) + bounds.top
                            );
                        } else if (command === "L") {
                            ctx.lineTo((cmd[1] as number) + bounds.left, (cmd[2] as number) + bounds.top);
                        }
                    });
                    ctx.stroke();
                }
            }
        });

        // Apply gaussian blur for feathering (simple approximation)
        // In production, use a proper blur filter
        ctx.filter = "blur(5px)";
        ctx.drawImage(tempCanvas, 0, 0);

        return tempCanvas.toDataURL("image/png").split(",")[1];
    }, [maskObjects]);

    // AI Edit callback - updates canvas with new image
    const handleAIEditComplete = useCallback((newImageBase64: string) => {
        const canvas = fabricRef.current;
        if (!canvas || !newImageBase64) return;

        // Clear all objects including masks
        canvas.getObjects().forEach((obj) => canvas.remove(obj));
        setMaskObjects([]);

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
                onClearMask={handleClearMask}
                hasMask={maskObjects.length > 0}
                isDrawing={isDrawing}
                actions={<ExportMenu fabricCanvas={fabricRef.current} />}
            />

            {/* Mask Info Banner */}
            {maskObjects.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-pink-500/10 border border-pink-500/20 rounded-lg text-sm text-pink-300">
                    <span>🎭</span>
                    <span>
                        Mask active ({maskObjects.length} region{maskObjects.length > 1 ? "s" : ""}) —
                        AI will only edit inside the masked area
                    </span>
                </div>
            )}

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
                maskBase64={extractMask()}
                hasMask={maskObjects.length > 0}
                onEditComplete={handleAIEditComplete}
            />
        </div>
    );
}

export default EditableCanvas;
