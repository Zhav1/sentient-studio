import { create } from "zustand";
import type { Campaign, Asset } from "@/lib/types";

interface CampaignState {
    // List of campaigns
    campaigns: Campaign[];

    // Currently selected campaign
    currentCampaign: Campaign | null;

    // Generation states
    isGenerating: boolean;
    generationProgress: string;

    // Error handling
    error: string | null;

    // Actions
    setCampaigns: (campaigns: Campaign[]) => void;
    addCampaign: (campaign: Campaign) => void;
    setCurrentCampaign: (campaign: Campaign | null) => void;
    updateCampaignAssets: (campaignId: string, assets: Asset[]) => void;
    setIsGenerating: (generating: boolean) => void;
    setGenerationProgress: (progress: string) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

const initialState = {
    campaigns: [],
    currentCampaign: null,
    isGenerating: false,
    generationProgress: "",
    error: null,
};

export const useCampaignStore = create<CampaignState>((set) => ({
    ...initialState,

    setCampaigns: (campaigns) => set({ campaigns }),

    addCampaign: (campaign) =>
        set((state) => ({
            campaigns: [campaign, ...state.campaigns],
        })),

    setCurrentCampaign: (campaign) => set({ currentCampaign: campaign }),

    updateCampaignAssets: (campaignId, assets) =>
        set((state) => ({
            campaigns: state.campaigns.map((c) =>
                c.id === campaignId ? { ...c, assets } : c
            ),
            currentCampaign:
                state.currentCampaign?.id === campaignId
                    ? { ...state.currentCampaign, assets }
                    : state.currentCampaign,
        })),

    setIsGenerating: (isGenerating) => set({ isGenerating }),

    setGenerationProgress: (generationProgress) => set({ generationProgress }),

    setError: (error) => set({ error }),

    reset: () => set(initialState),
}));
