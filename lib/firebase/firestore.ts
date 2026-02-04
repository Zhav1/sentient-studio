import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    Unsubscribe,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
} from "firebase/firestore";
import { getDb } from "./config";
import type { Brand, CanvasElement, BrandConstitution, ProcessedAsset } from "@/lib/types";
import type { Campaign, Asset } from "@/lib/types";

// ============ BRANDS ============

/**
 * Create a new brand
 */
export async function createBrand(brand: Omit<Brand, "id">): Promise<string> {
    const db = getDb();
    const brandsRef = collection(db, "brands");
    const newDocRef = doc(brandsRef);

    await setDoc(newDocRef, {
        ...brand,
        id: newDocRef.id,
        last_updated: serverTimestamp(),
        created_at: serverTimestamp(),
    });

    return newDocRef.id;
}

/**
 * Get a brand by ID
 */
export async function getBrand(brandId: string): Promise<Brand | null> {
    const db = getDb();
    const brandRef = doc(db, "brands", brandId);
    const brandSnap = await getDoc(brandRef);

    if (!brandSnap.exists()) return null;
    return brandSnap.data() as Brand;
}

/**
 * Get all brands
 */
export async function getAllBrands(): Promise<Brand[]> {
    const db = getDb();
    const brandsRef = collection(db, "brands");
    const q = query(brandsRef, orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data() as Brand);
}

/**
 * Update canvas elements for a brand
 */
export async function updateCanvasElements(
    brandId: string,
    elements: CanvasElement[]
): Promise<void> {
    const db = getDb();
    const brandRef = doc(db, "brands", brandId);

    await updateDoc(brandRef, {
        canvas_elements: elements,
        last_updated: serverTimestamp(),
    });
}

/**
 * Add a single element to canvas
 */
export async function addCanvasElement(
    brandId: string,
    element: CanvasElement
): Promise<void> {
    const db = getDb();
    const brandRef = doc(db, "brands", brandId);

    await updateDoc(brandRef, {
        canvas_elements: arrayUnion(element),
        last_updated: serverTimestamp(),
    });
}

/**
 * Update constitution cache
 */
export async function updateConstitution(
    brandId: string,
    constitution: BrandConstitution,
    processedAssets: Record<string, ProcessedAsset>
): Promise<void> {
    const db = getDb();
    const brandRef = doc(db, "brands", brandId);

    await updateDoc(brandRef, {
        constitution_cache: constitution,
        processed_assets: processedAssets,
        last_updated: serverTimestamp(),
    });
}

/**
 * Get constitution from brand cache (for memory)
 */
export async function getConstitution(brandId: string): Promise<BrandConstitution | null> {
    const brand = await getBrand(brandId);
    return brand?.constitution_cache || null;
}

/**
 * Save constitution to brand (simplified for memory)
 */
export async function saveConstitution(
    brandId: string,
    constitution: BrandConstitution
): Promise<void> {
    const db = getDb();
    const brandRef = doc(db, "brands", brandId);

    await updateDoc(brandRef, {
        constitution_cache: constitution,
        last_updated: serverTimestamp(),
    });
}

/**
 * Subscribe to brand updates (real-time)
 */
export function subscribeToBrand(
    brandId: string,
    callback: (brand: Brand | null) => void
): Unsubscribe {
    const db = getDb();
    const brandRef = doc(db, "brands", brandId);

    return onSnapshot(brandRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data() as Brand);
        } else {
            callback(null);
        }
    });
}

// ============ CAMPAIGNS ============

/**
 * Create a new campaign
 */
export async function createCampaign(
    campaign: Omit<Campaign, "id">
): Promise<string> {
    const db = getDb();
    const campaignsRef = collection(db, "campaigns");
    const newDocRef = doc(campaignsRef);

    await setDoc(newDocRef, {
        ...campaign,
        id: newDocRef.id,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
    });

    return newDocRef.id;
}

/**
 * Get campaigns for a brand
 */
export async function getCampaignsByBrand(brandId: string): Promise<Campaign[]> {
    const db = getDb();
    const campaignsRef = collection(db, "campaigns");
    const q = query(
        campaignsRef,
        where("brand_id", "==", brandId),
        orderBy("created_at", "desc")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data() as Campaign);
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
    campaignId: string,
    status: Campaign["status"]
): Promise<void> {
    const db = getDb();
    const campaignRef = doc(db, "campaigns", campaignId);

    await updateDoc(campaignRef, {
        status,
        updated_at: serverTimestamp(),
    });
}

/**
 * Add asset to campaign
 */
export async function addAssetToCampaign(
    campaignId: string,
    asset: Asset
): Promise<void> {
    const db = getDb();
    const campaignRef = doc(db, "campaigns", campaignId);

    await updateDoc(campaignRef, {
        assets: arrayUnion(asset),
        updated_at: serverTimestamp(),
    });
}

/**
 * Subscribe to campaign updates (real-time)
 */
export function subscribeToCampaign(
    campaignId: string,
    callback: (campaign: Campaign | null) => void
): Unsubscribe {
    const db = getDb();
    const campaignRef = doc(db, "campaigns", campaignId);

    return onSnapshot(campaignRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data() as Campaign);
        } else {
            callback(null);
        }
    });
}

/**
 * Delete a brand
 */
export async function deleteBrand(brandId: string): Promise<void> {
    const db = getDb();
    await deleteDoc(doc(db, "brands", brandId));
}
