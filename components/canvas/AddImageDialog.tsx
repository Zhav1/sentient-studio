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
    const [activeTab, setActiveTab] = useState<"url" | "upload">("upload");
    const [url, setUrl] = useState("");
    const [previews, setPreviews] = useState<string[]>([]);

    const handleAdd = () => {
        if (activeTab === "url" && url) {
            onAddImage(url);
            onOpenChange(false);
            setUrl("");
            setPreviews([]);
        } else if (activeTab === "upload" && previews.length > 0) {
            previews.forEach(p => onAddImage(p));
            onOpenChange(false);
            setPreviews([]);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newPreviews: string[] = [];
            const readers: FileReader[] = [];

            // Convert FileList to Array
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                readers.push(reader);
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        newPreviews.push(reader.result);
                        // Only update state when all files are read
                        if (newPreviews.length === files.length) {
                            setPreviews(prev => [...prev, ...newPreviews]);
                        }
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] glass border-white/10 text-foreground">
                <DialogHeader>
                    <DialogTitle>Add Images to Moodboard</DialogTitle>
                    <DialogDescription>
                        Upload multiple reference images to extract your Brand DNA.
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
                                    <span className="text-xs text-muted-foreground">Click to upload multiple images</span>
                                </div>
                                <Input
                                    id="file"
                                    type="file"
                                    multiple
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </Label>
                        </div>
                    )}

                    {/* Preview Area - Grid for multiple images */}
                    {activeTab === "upload" && previews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-2 bg-black/20 rounded-lg">
                            {previews.map((src, idx) => (
                                <div key={idx} className="relative aspect-video rounded-md overflow-hidden border border-white/10 bg-black/50">
                                    <img 
                                        src={src} 
                                        alt={`Preview ${idx}`} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "url" && url && (
                         <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-black/50 flex items-center justify-center">
                            <img 
                                src={url} 
                                alt="Preview" 
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleAdd} disabled={(!url && previews.length === 0)}>
                        Add {previews.length > 0 ? `${previews.length} Images` : "to Canvas"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
