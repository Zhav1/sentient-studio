"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Image as ImageIcon, Link as LinkIcon, Upload, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddImageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddImage: (url: string) => void;
}

export function AddImageDialog({ open, onOpenChange, onAddImage }: AddImageDialogProps) {
    const [activeTab, setActiveTab] = useState<"url" | "upload">("url");
    const [url, setUrl] = useState("");
    const [preview, setPreview] = useState<string | null>(null);

    const handleAdd = () => {
        if (activeTab === "url" && url) {
            onAddImage(url);
            onOpenChange(false);
            setUrl("");
            setPreview(null);
        } else if (activeTab === "upload" && preview) {
            onAddImage(preview);
            onOpenChange(false);
            setPreview(null);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] glass border-white/10 text-foreground">
                <DialogHeader>
                    <DialogTitle>Add Image</DialogTitle>
                    <DialogDescription>
                        Add an image to your moodboard. Paste a URL or upload a file.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Custom Tabs */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-lg">
                        <button
                            onClick={() => setActiveTab("url")}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                                activeTab === "url" ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <LinkIcon className="w-4 h-4" />
                            URL
                        </button>
                        <button
                            onClick={() => setActiveTab("upload")}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                                activeTab === "upload" ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <Upload className="w-4 h-4" />
                            Upload
                        </button>
                    </div>

                    {activeTab === "url" && (
                        <div className="grid gap-2">
                            <Label htmlFor="url">Image URL</Label>
                            <Input
                                id="url"
                                placeholder="https://example.com/image.png"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="bg-black/50 border-white/10"
                            />
                        </div>
                    )}

                    {activeTab === "upload" && (
                        <div className="grid gap-2">
                            <Label htmlFor="file" className="cursor-pointer">
                                <div className="border-2 border-dashed border-white/10 rounded-lg p-8 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Click to upload</span>
                                </div>
                                <Input
                                    id="file"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </Label>
                        </div>
                    )}

                    {/* Preview Area */}
                    {(url || preview) && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/50 flex items-center justify-center">
                            <img 
                                src={activeTab === "url" ? url : preview || ""} 
                                alt="Preview" 
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleAdd} disabled={(!url && !preview)}>
                        Add to Canvas
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
