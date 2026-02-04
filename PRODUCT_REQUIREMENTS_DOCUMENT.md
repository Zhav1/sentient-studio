# Product Requirements Document (PRD): "Sentient Studio"

**Version:** 2.1 (Revised Architecture)  
**Target:** Hackathon Winning MVP  
**Constraints:** Windows OS, 100% Free Tier (Vercel/Firebase Firestore), TypeScript Full-Stack

---

## 1. Technical Stack (The "Free & Fast" Spec)

This stack is chosen for **zero-cost deployment** and Windows compatibility.

### Frontend (UI/UX)

- **Framework:** Next.js 14 (App Router) - Deploy to Vercel
- **State Management:** Zustand (for the Canvas state)
- **UI Library:** Shadcn/UI (Radix Primitives) + Tailwind CSS
- **Drag-and-Drop:** dnd-kit (for the moodboard/canvas)

### Backend (Serverless Logic)
>
> **Architecture Pivot (v2.1):** Changed from Python Cloud Functions to Next.js API Routes for 100% free tier compatibility.

- **Platform:** Vercel Serverless Functions (via Next.js API Routes)
- **Runtime:** Node.js 20 (TypeScript)
- **AI SDK:** `@google/generative-ai` (TypeScript)

### Database & Storage

- **DB:** Google Cloud Firestore (NoSQL) - Free tier: 50K reads/day
- **Asset Storage:** Vercel Blob - Free tier: 5GB

### AI Orchestration

- **SDK:** `@google/generative-ai` (TypeScript)
- **Models:** Gemini 2.0 Flash (Reasoning/Vision/Generation)

---

## 2. The Three Agents (API Routes)

These agents run as **Next.js API Routes** (serverless functions on Vercel).

### Agent A: "The Archivist" (The Living Brain)

**Role:** Observes the user's "Canvas." Translates raw uploads (images, mood text, color swatches) into a strict technical JSON schema.

**Endpoint:** `POST /api/analyze`

**Gemini System Prompt:**

```
ROLE: You are the Guardian of the Brand Identity.
INPUT: A list of image URLs and text notes from the user's 'Moodboard'.
TASK: Analyze the inputs to deduce the 'Brand Constitution'.

OUTPUT JSON (Strict Schema):
{
  "visual_identity": {
    "color_palette_hex": ["#FF0000", "#000000"],
    "photography_style": "High contrast, neon lighting, wide angle",
    "forbidden_elements": ["Sepia tone", "Cartoon vectors", "Smiling people"]
  },
  "voice": {
    "tone": "Aggressive, Cyberpunk, Minimalist",
    "keywords": ["Future", "Speed", "Grim"]
  },
  "risk_thresholds": {
    "nudity": "STRICT_ZERO_TOLERANCE",
    "political": "ALLOW_SATIRE"
  }
}

CONSTRAINT: If the user uploads conflicting images, prioritize the most recent upload and note the shift in 'voice'.
```

---

### Agent B: "The Fabricator" (The Hand)

**Role:** Generates the actual marketing assets based on the Constitution (from Agent A) and the Campaign Brief.

**Endpoint:** `POST /api/generate`

**Prompting Strategy:**

- Does NOT just take the user's prompt
- Injects Agent A's JSON into the prompt:

```
Generate an image for [User Prompt]. 
STYLE GUIDE: Use colors [Agent A.colors]. 
Lighting must be [Agent A.style]. 
DO NOT include [Agent A.forbidden].
```

---

### Agent C: "The Sentinel" (The Judge)

**Role:** The "Brand Check" module. Creates the heatmap and risk score.

**Endpoint:** `POST /api/audit`

**Gemini System Prompt:**

```
ROLE: You are the ISO-9001 Compliance Auditor.
INPUT: Generated Image URL + The 'Brand Constitution' JSON.
TASK: Perform a pixel-level audit.

OUTPUT JSON:
{
  "compliance_score": 85, // 0-100
  "pass": boolean, // Threshold > 90
  "heatmap_coordinates": [
    {"x": 10, "y": 10, "issue": "Logo is distorted"},
    {"x": 50, "y": 80, "issue": "Color #F0F0F0 is not in palette"}
  ],
  "fix_instructions": "The logo in the top left is warped. Re-render with higher weight on logo clarity."
}
```

---

## 3. Data Schema (Firestore)

Relational structure in NoSQL to link the "Living Bible" to the "Jobs".

### Collection: `brands` (The Canvas State)

```json
{
  "id": "brand_xyz",
  "name": "CyberNike",
  "canvas_elements": [
    {"type": "image", "url": "https://...", "hash": "a1b2c3...", "x": 10, "y": 20},
    {"type": "note", "text": "Make it look like Blade Runner 2049", "x": 50, "y": 50}
  ],
  "constitution_cache": { /* JSON from Agent A */ },
  "processed_assets": {
    "a1b2c3d4...": {
      "type": "image",
      "extracted_rules": { /* cached analysis */ },
      "timestamp": 1770123456
    }
  },
  "last_updated": "timestamp"
}
```

### Collection: `campaigns` (The Projects)

```json
{
  "id": "camp_001",
  "brand_id": "brand_xyz",
  "title": "Summer Launch",
  "user_prompt": "A runner sprinting through Tokyo at night"
}
```

### Sub-Collection: `campaigns/{id}/assets` (The Output)

```json
{
  "id": "asset_999",
  "status": "REJECTED", // GENERATING -> AUDITING -> APPROVED/REJECTED
  "image_url": "https://...",
  "risk_score": 45,
  "sentinel_feedback": "Too dark. Logo missing.",
  "attempt_number": 2
}
```

---

## 4. API & Infrastructure

### Directory Structure

```
sentient-studio/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts    # Agent A: Archivist
│   │   ├── generate/route.ts   # Agent B: Fabricator
│   │   └── audit/route.ts      # Agent C: Sentinel
│   ├── canvas/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── [campaignId]/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── canvas/
│   │   ├── MoodboardCanvas.tsx
│   │   ├── CanvasElement.tsx
│   │   └── ConstitutionSidebar.tsx
│   └── ui/ (shadcn components)
├── lib/
│   ├── firebase/
│   │   ├── config.ts
│   │   └── firestore.ts
│   ├── store/
│   │   └── canvasStore.ts
│   ├── ai/
│   │   └── gemini.ts
│   └── utils/
│       └── hash.ts
├── .env.local
├── package.json
└── firebase.json
```

### Key Endpoints (API Routes)

| Route | Agent | Trigger |
|-------|-------|---------|
| `POST /api/analyze` | Archivist | Canvas update in frontend |
| `POST /api/generate` | Fabricator | Campaign creation |
| `POST /api/audit` | Sentinel | Asset generation complete |

---

## 5. Deduplication Layer ("The Bouncer")

**Strategy: "Hash, Check, Then Act"**

We use the file's digital fingerprint (SHA-256 Hash) instead of filenames.

**Flow:**

1. **Frontend:** Calculate hash before upload using `crypto.subtle.digest()`
2. **Storage:** Store file at Vercel Blob with hash-based naming
3. **Database:** Check if hash exists in `processed_assets`
   - If Yes: Skip API call, reuse cached data
   - If No: Wake up Agent A for analysis

**Frontend Implementation:**

```typescript
async function handleDrop(files: File[]) {
  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Upload and update Firestore with hash
  }
}
```

---

## 6. The "Wow" Factor Demo Flow

1. **The Setup:** Open "Sentient Studio." It's empty.

2. **The Input:** Drag 3 random images (neon sign, gloomy street, sneaker) onto Canvas.

3. **The "Ah-Ha" (Agent A):** Sidebar auto-scrolls: "Analyzing... Detected 'Neo-Noir' Aesthetic... Extracting Palette #00FFCC... Brand Constitution Updated."

4. **The Action:** Type ONE sentence: "Launch poster."

5. **The Execution (Agent B & C):** UI splits:
   - Left: AI generating images
   - Right: Sentinel rejecting live. "REJECTED: Too bright." → "REJECTED: Wrong sneaker model."

6. **The Prestige:** Green checkmark appears. Final image perfectly matches the "vibe."

---

## 7. Deployment

- **Frontend + API:** Vercel (automatic from GitHub)
- **Database:** Firebase Firestore (free tier)
- **Storage:** Vercel Blob (free tier)
- **Cost:** $0/month within free tier limits
