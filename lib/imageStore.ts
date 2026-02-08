// File-based image store for large base64 images
// In-memory stores don't work reliably in Next.js due to:
// 1. Separate server instances for different requests
// 2. Hot module reloading clearing memory
// 3. Serverless function isolation

import fs from "fs";
import path from "path";
import os from "os";

// Use temp directory for image cache
const CACHE_DIR = path.join(os.tmpdir(), "sentient-studio-images");

// Ensure cache directory exists
function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
}

export function storeImage(image: string): string {
    ensureCacheDir();
    const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const filePath = path.join(CACHE_DIR, `${id}.txt`);

    fs.writeFileSync(filePath, image, "utf-8");
    console.log(`[ImageStore] Stored image ${id} to ${filePath}, size: ${image.length} chars`);

    return id;
}

export function getImage(id: string): string | null {
    const filePath = path.join(CACHE_DIR, `${id}.txt`);

    if (!fs.existsSync(filePath)) {
        console.warn(`[ImageStore] Image ${id} not found at ${filePath}`);
        return null;
    }

    const image = fs.readFileSync(filePath, "utf-8");

    // Delete after retrieval (one-time use)
    fs.unlinkSync(filePath);
    console.log(`[ImageStore] Retrieved and deleted image ${id}`);

    return image;
}

export function hasImage(id: string): boolean {
    const filePath = path.join(CACHE_DIR, `${id}.txt`);
    return fs.existsSync(filePath);
}

// Clean up old images (> 10 min) on module load
function cleanupOldImages() {
    try {
        ensureCacheDir();
        const now = Date.now();
        const files = fs.readdirSync(CACHE_DIR);
        for (const file of files) {
            const filePath = path.join(CACHE_DIR, file);
            const stats = fs.statSync(filePath);
            // Delete files older than 10 minutes
            if (now - stats.mtimeMs > 10 * 60 * 1000) {
                fs.unlinkSync(filePath);
                console.log(`[ImageStore] Cleaned up old image: ${file}`);
            }
        }
    } catch {
        // Ignore cleanup errors
    }
}

// Run cleanup on module load
cleanupOldImages();
