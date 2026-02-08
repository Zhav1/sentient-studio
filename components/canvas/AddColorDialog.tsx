"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddColorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddColor: (color: string) => void;
}

const PRESET_COLORS = [
    "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF",
    "#FFFFFF", "#000000", "#808080", "#FFA500", "#800080", "#008080",
    "#1E293B", "#334155", "#475569", "#94A3B8", "#CBD5E1", "#F1F5F9"
];

export function AddColorDialog({ open, onOpenChange, onAddColor }: AddColorDialogProps) {
    const [color, setColor] = useState("#000000");

    const handleAdd = () => {
        if (color) {
            onAddColor(color);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] glass border-white/10 text-foreground">
                <DialogHeader>
                    <DialogTitle>Add Color Swatch</DialogTitle>
                    <DialogDescription>
                        Pick a color from the palette or enter a hex code.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="hex">Custom Hex</Label>
                        <div className="flex gap-2">
                            <div 
                                className="w-10 h-10 rounded-md border border-white/20 shadow-inner"
                                style={{ backgroundColor: color }}
                            />
                            <Input
                                id="hex"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="bg-black/50 border-white/10 font-mono"
                                placeholder="#000000"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Presets</Label>
                        <div className="grid grid-cols-6 gap-2">
                            {PRESET_COLORS.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setColor(preset)}
                                    className={cn(
                                        "w-8 h-8 rounded-full border border-white/10 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary",
                                        color === preset && "ring-2 ring-primary scale-110"
                                    )}
                                    style={{ backgroundColor: preset }}
                                    aria-label={`Select color ${preset}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleAdd}>
                        Add Swatch
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
