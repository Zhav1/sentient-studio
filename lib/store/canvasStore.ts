import { create } from "zustand";
import type { Brand, CanvasElement, BrandConstitution } from "@/lib/types";

interface CanvasState {
    // Current brand being edited
    currentBrand: Brand | null;

    // Canvas elements (local state)
    elements: CanvasElement[];

    // AI-generated constitution
    constitution: BrandConstitution | null;

    // Processing states
    isAnalyzing: boolean;
    isSaving: boolean;

    // Error handling
    error: string | null;

    // Actions
    setCurrentBrand: (brand: Brand | null) => void;
    setElements: (elements: CanvasElement[]) => void;
    addElement: (element: CanvasElement) => void;
    removeElement: (id: string) => void;
    updateElementPosition: (id: string, x: number, y: number) => void;
    setConstitution: (constitution: BrandConstitution | null) => void;
    setIsAnalyzing: (analyzing: boolean) => void;
    setIsSaving: (saving: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

const initialState = {
    currentBrand: null,
    elements: [],
    constitution: null,
    isAnalyzing: false,
    isSaving: false,
    error: null,
};

export const useCanvasStore = create<CanvasState>((set) => ({
    ...initialState,

    setCurrentBrand: (brand) =>
        set({
            currentBrand: brand,
            elements: brand?.canvas_elements ?? [],
            constitution: brand?.constitution_cache ?? null,
        }),

    setElements: (elements) => set({ elements }),

    addElement: (element) =>
        set((state) => ({
            elements: [...state.elements, element],
        })),

    removeElement: (id) =>
        set((state) => ({
            elements: state.elements.filter((el) => el.id !== id),
        })),

    updateElementPosition: (id, x, y) =>
        set((state) => ({
            elements: state.elements.map((el) =>
                el.id === id ? { ...el, x, y } : el
            ),
        })),

    setConstitution: (constitution) => set({ constitution }),

    setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

    setIsSaving: (isSaving) => set({ isSaving }),

    setError: (error) => set({ error }),

    reset: () => set(initialState),
}));
