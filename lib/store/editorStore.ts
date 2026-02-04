/**
 * Editor Store - Zustand store for canvas editor state
 */

import { create } from "zustand";

interface EditorState {
    // Image state
    currentImageBase64: string | null;
    originalImageBase64: string | null;

    // Edit history for undo/redo
    editHistory: string[];
    historyIndex: number;

    // AI Edit state
    thoughtSignature: string | null;
    isAIEditing: boolean;

    // Actions
    setImage: (base64: string) => void;
    updateImage: (base64: string) => void;
    setThoughtSignature: (sig: string | null) => void;
    setAIEditing: (editing: boolean) => void;
    undo: () => void;
    redo: () => void;
    reset: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
    currentImageBase64: null,
    originalImageBase64: null,
    editHistory: [],
    historyIndex: -1,
    thoughtSignature: null,
    isAIEditing: false,

    setImage: (base64) => {
        set({
            currentImageBase64: base64,
            originalImageBase64: base64,
            editHistory: [base64],
            historyIndex: 0,
            thoughtSignature: null,
        });
    },

    updateImage: (base64) => {
        const { editHistory, historyIndex } = get();
        // Truncate any redo history
        const newHistory = editHistory.slice(0, historyIndex + 1);
        newHistory.push(base64);

        set({
            currentImageBase64: base64,
            editHistory: newHistory,
            historyIndex: newHistory.length - 1,
        });
    },

    setThoughtSignature: (sig) => set({ thoughtSignature: sig }),

    setAIEditing: (editing) => set({ isAIEditing: editing }),

    undo: () => {
        const { editHistory, historyIndex } = get();
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            set({
                historyIndex: newIndex,
                currentImageBase64: editHistory[newIndex],
            });
        }
    },

    redo: () => {
        const { editHistory, historyIndex } = get();
        if (historyIndex < editHistory.length - 1) {
            const newIndex = historyIndex + 1;
            set({
                historyIndex: newIndex,
                currentImageBase64: editHistory[newIndex],
            });
        }
    },

    reset: () => {
        const { originalImageBase64 } = get();
        if (originalImageBase64) {
            set({
                currentImageBase64: originalImageBase64,
                editHistory: [originalImageBase64],
                historyIndex: 0,
                thoughtSignature: null,
            });
        }
    },
}));
