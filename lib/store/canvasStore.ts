import { create } from "zustand";
import type { Brand, CanvasElement, BrandConstitution } from "@/lib/types";

interface CanvasState {
    // Current brand being edited
    currentBrand: Brand | null;

    // Canvas elements (local state)
    elements: CanvasElement[];
    
    // Selection state
    selectedElementId: string | null;

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
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    selectElement: (id: string | null) => void;
    setConstitution: (constitution: BrandConstitution | null) => void;
    setIsAnalyzing: (analyzing: boolean) => void;
    setIsSaving: (saving: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

const initialState = {
    currentBrand: null,
    elements: [],
    selectedElementId: null,
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
            selectedElementId: null,
        }),

    setElements: (elements) => set({ elements }),

    addElement: (element) =>
        set((state) => ({
            elements: [...state.elements, element],
            selectedElementId: element.id,
        })),

    removeElement: (id) =>
        set((state) => ({
            elements: state.elements.filter((el) => el.id !== id),
            selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        })),

    updateElementPosition: (id, x, y) =>
        set((state) => ({
            elements: state.elements.map((el) =>
                el.id === id ? { ...el, x, y } : el
            ),
        })),

    updateElement: (id, updates) =>
        set((state) => ({
            elements: state.elements.map((el) =>
                el.id === id ? { ...el, ...updates } : el
            ),
        })),

    selectElement: (id) => set({ selectedElementId: id }),

    setConstitution: (constitution) => set({ constitution }),

    setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

    setIsSaving: (isSaving) => set({ isSaving }),

    setError: (error) => set({ error }),

    reset: () => set(initialState),
}));
