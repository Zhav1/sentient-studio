/**
 * Asset status in the generation/audit pipeline
 */
export type AssetStatus =
    | "GENERATING"
    | "AUDITING"
    | "APPROVED"
    | "REJECTED"
    | "FAILED";

/**
 * Heatmap coordinate for compliance issues
 */
export interface HeatmapCoordinate {
    x: number;
    y: number;
    issue: string;
}

/**
 * Sentinel audit result
 */
export interface AuditResult {
    compliance_score: number;
    pass: boolean;
    heatmap_coordinates: HeatmapCoordinate[];
    fix_instructions: string;
}

/**
 * Generated asset document
 */
export interface Asset {
    id: string;
    campaign_id: string;
    status: AssetStatus;
    image_url: string | null;
    risk_score: number | null;
    sentinel_feedback: string | null;
    audit_result: AuditResult | null;
    attempt_number: number;
    created_at: number;
    updated_at: number;
}

/**
 * Campaign document
 */
export interface Campaign {
    id: string;
    brand_id: string;
    title: string;
    user_prompt: string;
    status: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
    assets: Asset[];
    created_at: number;
    updated_at: number;
}

/**
 * Create a new campaign
 */
export function createCampaign(
    brandId: string,
    title: string,
    prompt: string
): Omit<Campaign, "id"> {
    return {
        brand_id: brandId,
        title,
        user_prompt: prompt,
        status: "PENDING",
        assets: [],
        created_at: Date.now(),
        updated_at: Date.now(),
    };
}

/**
 * Create a new asset placeholder
 */
export function createAssetPlaceholder(campaignId: string): Omit<Asset, "id"> {
    return {
        campaign_id: campaignId,
        status: "GENERATING",
        image_url: null,
        risk_score: null,
        sentinel_feedback: null,
        audit_result: null,
        attempt_number: 1,
        created_at: Date.now(),
        updated_at: Date.now(),
    };
}
