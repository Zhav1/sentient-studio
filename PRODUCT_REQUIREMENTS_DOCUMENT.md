# Sentient Studio — Product Requirements Document

> **AI-Powered Brand Intelligence Platform for Creators**
> Built on **Gemini 3** • Hackathon MVP → Startup

---

## Executive Summary

Sentient Studio is an **AI brand manager for content creators** — YouTubers, streamers, influencers, and independent creatives who need consistent visual identity but can't afford dedicated designers.

Unlike generic design tools (Canva, Adobe Express), Sentient Studio **learns your brand DNA** from existing content, then ensures every new asset matches your unique aesthetic. It's not a design tool — it's **brand intelligence** that happens to generate designs.

---

## Strategic Background

### Why We Pivoted

Our initial positioning — "AI marketing asset generator" — placed us directly against Canva AI, Adobe Firefly, and a dozen well-funded competitors. After competitive analysis, we identified a fatal flaw:

> **Feature parity is not a moat.**

Canva has 10+ years of iteration, billions in funding, and platform lock-in. We can't out-feature them.

Instead, we asked: **"Who is underserved by generic design tools?"**

### The Underserved Segment: Content Creators

| Pain Point | Current Solutions | Gap |
|------------|-------------------|-----|
| Brand inconsistency across thumbnails/posts | Manual discipline or expensive designers | No AI that **learns** your brand |
| Hours spent on routine graphics | Canva templates (generic, not personalized) | No tool that **generates in your style** |
| Can't articulate "my brand" but knows when it's wrong | Brand guideline PDFs (creators don't make these) | No **automatic brand extraction** |
| Growing audience = more content demand | Hire designers (expensive) or sacrifice quality | No **scalable quality** solution |

### Why Creators Win the Hackathon + Startup

| Criterion | How This Wedge Delivers |
|-----------|------------------------|
| **Demo Speed** | 90-second magic moment (analyze channel → generate on-brand asset) |
| **Gemini Showcase** | Multi-modal analysis + generation + reasoning |
| **Relatable Impact** | Judges understand creator economy pain |
| **Startup Viability** | 10M+ micro-creators globally, self-serve SaaS model |
| **Code Reuse** | 85%+ of existing architecture applies |

---

## Market Analysis

### Creator Economy Overview

| Metric | Value | Source |
|--------|-------|--------|
| Total creators globally | 200M+ | SignalFire 2024 |
| Micro/mid-tier (our target) | 50M+ | 10K-1M followers |
| Annual creator economy | $250B+ | Goldman Sachs |
| Avg spend on tools | $50-300/mo | Creator surveys |

### Target Persona: "The Rising Creator"

**Demographics:**

- 18-35 years old
- 10K-500K followers on primary platform
- Creates 10-50 pieces of content per month
- Revenue: $500-10K/month from content

**Psychographics:**

- Knows their "vibe" intuitively but can't articulate it
- Frustrated by time spent on graphics (not their core skill)
- Jealous of bigger creators with consistent aesthetics
- Price-sensitive but willing to pay for time savings

**Jobs to be Done:**

1. "Help me make thumbnails that look like *me*"
2. "Save me 5+ hours/week on graphics"
3. "Make my channel look professional and cohesive"
4. "Let me focus on content, not design"

### Competitive Landscape (Detailed Analysis)

#### Tier 1: Platform Giants

| Competitor | Pricing | Key Features | Weakness | Our Counter |
|------------|---------|--------------|----------|-------------|
| **Canva Magic Studio** | Free / $13-15/mo Pro | AI image generation, 100M+ templates, brand kit | Generic templates, no brand learning, one-size-fits-all AI | We learn YOUR specific style from your existing content |
| **Adobe Express** | Free / $10/mo | Firefly AI, Adobe ecosystem, professional polish | Complex for non-designers, no creator-specific workflow | Purpose-built for creators, 60-second onboarding |

**Why they're not the real threat:** Platform giants optimize for breadth (everyone), not depth (creators). Their AI generates *generic* styles, not *your* style.

---

#### Tier 2: YouTube Thumbnail Specialists (DIRECT COMPETITORS)

| Competitor | Pricing | Key Features | Weakness | Our Counter |
|------------|---------|--------------|----------|-------------|
| **Pikzels AI** | $20-80/mo (credit-based) | Recreate mode, FaceSwap, Persona training, CTR scoring | Credit burns fast (10-20 per thumbnail), expensive for volume, thumbnail-only | Unlimited generations, full brand system beyond thumbnails |
| **Thumbnail.ai** | Free | Fast generation, no signup, CTR-optimized | No brand memory, each thumbnail is isolated, no consistency | Persistent brand DNA ensures every asset matches |
| **Thumbmagic** | Free tier available | Video-to-thumbnail, 3 variants, no watermark | Basic features, no brand learning | Multi-agent intelligence, learns and improves |
| **WayinVideo** | Varies | Scene analysis, style cloning, portrait integration | Focused on video frames, not brand consistency | Holistic brand approach, not just thumbnails |
| **Vmake.ai** | Varies | Video frame extraction, background removal | Tool-focused, not brand-focused | Brand-first philosophy |

**Critical Gap We Exploit:**  
All thumbnail tools treat each generation as **isolated**. They don't remember your brand. Every time you generate, you start from scratch.

> **Sentient Studio remembers.** Your 100th thumbnail is informed by your first 99.

---

#### Tier 3: AI Brand Identity Platforms

| Competitor | Pricing | Key Features | Weakness | Our Counter |
|------------|---------|--------------|----------|-------------|
| **Looka** | $20-96 one-time | Logo generation, brand kit, social templates | Questionnaire-based (asks you to define brand), static output | We extract brand from EXISTING content, no questionnaires |
| **uBrand** | $19-149/mo | AI logo, brand guidelines, social publishing | Starts from scratch, doesn't analyze your current presence | We analyze what you've already built |
| **Pixelcut** | Free / $10/mo | AI brand kit, logo, colors, fonts | Generic brand generation, not personalized | Personalized to YOUR existing aesthetic |
| **Mavic.ai** | Varies | Logo, colors, fonts, social templates | Prompt-based, not content-based extraction | We look at your actual content, not descriptions |

**Critical Gap We Exploit:**  
Brand platforms ask: *"Describe your brand in words."*

Creators struggle with this. They know their vibe but can't articulate it.

> **Sentient Studio shows, not tells.** Upload your thumbnails. We'll tell YOU what your brand is.

---

#### Tier 4: Emerging AI Creative Tools

| Competitor | Pricing | Key Features | Weakness | Our Counter |
|------------|---------|--------------|----------|-------------|
| **Simplified** | Free / $15/mo+ | Content-aware AI, social templates, video | Generic, not creator-specialized | Creator-first UX and workflow |
| **Visme** | Free / $12-25/mo | Interactive content, presentations | Enterprise-focused, complex | Simple creator workflow |
| **Kittl** | Free / $10-25/mo | Logo, marketing templates | Design tool, not brand intelligence | We're brand intelligence that generates |
| **Picsart** | Free / $13/mo | Mobile-friendly, AI generation | Tool-focused, not system-focused | Brand system, not individual tools |

---

### Competitive Positioning Matrix

```
                         BRAND INTELLIGENCE
                              HIGH
                               ▲
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                    │  SENTIENT STUDIO    │
                    │    ★ (TARGET)       │
                    │          │          │
    SINGLE         ─┼──────────┼──────────┼─  MULTI-ASSET
    ASSET           │          │          │   SYSTEM
                    │  Pikzels │  uBrand  │
                    │  Thumbnail.ai       │
                    │          │          │
                    │  Canva   │  Looka   │
                    │  Adobe   │          │
                    └──────────┼──────────┘
                               │
                               ▼
                              LOW
```

**Our unique position:** High brand intelligence + Multi-asset system

No competitor occupies this quadrant. This is our moat.

---

### Competitive Moats (How We Win)

#### Moat 1: **Brand Extraction, Not Brand Definition**

| Competitors | Our Approach |
|-------------|--------------|
| Ask users to define brand via questionnaires | Analyze existing content to EXTRACT brand |
| "What colors do you like?" | "Based on your thumbnails, you favor warm tones with 60% saturation" |
| Requires design literacy | Works even if creator can't articulate their style |

**Why this wins:** Creators know their vibe intuitively but struggle to describe it. We remove that friction.

---

#### Moat 2: **Persistent Brand Memory**

| Competitors | Our Approach |
|-------------|--------------|
| Each generation is isolated | Every generation builds on brand memory |
| No learning from corrections | User edits improve future outputs |
| Static style | Evolving understanding of creator's brand |

**Technical Implementation:**

- `BrandConstitution` stored in Firestore
- Correction patterns tracked and applied
- Cross-session context via Gemini long-context window

---

#### Moat 3: **Multi-Agent Compliance Loop**

| Competitors | Our Approach |
|-------------|--------------|
| Generate and hope | Generate → Audit → Score → Approve/Reject |
| No quality gate | Compliance Auditor blocks off-brand outputs |
| Post-generation fixes | Pre-export enforcement |

**Demo moment:** Show an off-brand generation being blocked with explanation.

---

#### Moat 4: **Gemini 3 Native Capabilities**

| Capability | How We Use It | Competitor Gap |
|------------|---------------|----------------|
| Thinking Mode | Visible brand reasoning | Black-box AI |
| Multi-modal | Analyze images to extract style | Text-only prompts |
| Function Calling | Multi-agent orchestration | Monolithic models |
| Search Grounding | Real-time trend awareness | Static knowledge |
| 4K Generation | Professional output | Lower resolution |

**Hackathon Advantage:** We're built FROM THE GROUND UP on Gemini 3. Competitors bolt AI onto existing tools.

---

### Why We Win: The Summary

| Competitor Weakness | Sentient Studio Strength |
|--------------------|-------------------------|
| Generic templates | Personalized to YOUR content |
| Brand questionnaires | Brand EXTRACTION from visuals |
| Isolated generations | Persistent brand memory |
| Single asset focus | Full multi-asset brand system |
| Black-box AI | Visible thinking and reasoning |
| Credit-based pricing | Unlimited generations (Pro tier) |
| Thumbnail-only | Thumbnails + banners + posts + stories |

> **One-liner differentiation:**  
> "Canva gives you templates. Pikzels gives you thumbnails. **Sentient Studio learns your brand.**"

---

## Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15 (App Router, React 19) | Interactive web application |
| AI Core | Gemini 3 Model Family | Multi-modal intelligence |
| Canvas | Fabric.js 6 | Interactive editing |
| State | Zustand | Client-side state management |
| Database | Firestore | User data, brand memories |
| Cache | File-based temp storage | Large asset handling |

### Gemini 3 Model Selection

| Use Case | Model | Capability |
|----------|-------|------------|
| Agent Orchestration | `gemini-3-flash-preview` | Fast reasoning, function calling |
| Brand DNA Analysis | `gemini-3-flash-preview` | Multi-modal content understanding |
| Image Generation | `gemini-3-pro-image-preview` | 4K output, style transfer |
| AI Editing | `gemini-3-pro-image-preview` | Conversational image editing |
| Trend Research | `gemini-3-flash-preview` | Google Search grounding |
| Compliance Audit | `gemini-3-flash-preview` | Brand consistency verification |

---

## Multi-Agent Architecture

### Agent Overview

Sentient Studio uses **specialized agents** that collaborate through an **orchestrator**. Each agent has focused expertise, enabling smarter decisions than a single monolithic model.

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR AGENT                         │
│        (gemini-3-flash-preview + thinkingConfig: high)         │
│                                                                 │
│   Responsibilities:                                             │
│   • Interpret user intent                                       │
│   • Route to specialized agents                                 │
│   • Maintain conversation context                               │
│   • Synthesize multi-agent outputs                              │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   BRAND DNA     │ │   CREATIVE      │ │   COMPLIANCE    │
│   ANALYST       │ │   DIRECTOR      │ │   AUDITOR       │
│                 │ │                 │ │                 │
│ • Extract brand │ │ • Generate      │ │ • Check brand   │
│   constitution  │ │   assets        │ │   consistency   │
│ • Analyze       │ │ • Style         │ │ • Score         │
│   existing      │ │   transfer      │ │   adherence     │
│   content       │ │ • Iterate on    │ │ • Suggest       │
│ • Detect style  │ │   feedback      │ │   corrections   │
│   patterns      │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   TREND         │ │   CONTEXT       │ │   EXPORT        │
│   SCOUT         │ │   MEMORY        │ │   OPTIMIZER     │
│                 │ │                 │ │                 │
│ • Real-time     │ │ • Long-term     │ │ • Platform-     │
│   trend scan    │ │   brand memory  │ │   specific      │
│ • Competitor    │ │ • Session       │ │   formatting    │
│   analysis      │ │   continuity    │ │ • Resolution    │
│ • Cultural      │ │ • Learning from │ │   optimization  │
│   awareness     │ │   corrections   │ │ • Batch export  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Agent Specifications

#### 1. Orchestrator Agent

**Role:** Central coordinator that interprets user requests and routes to specialists.

**Capabilities:**

- Natural language intent parsing
- Multi-agent task decomposition
- Context aggregation across agents
- Quality gate before final output

**Gemini Features Used:**

- `thinkingConfig: { includeThoughts: true }` for reasoning visibility
- Function calling for agent routing
- Long context window for conversation history

---

#### 2. Brand DNA Analyst

**Role:** Extract and maintain the creator's brand essence.

**Trigger Conditions:**

- New content samples uploaded
- First-time brand setup
- Brand refresh requested
- Periodic brand drift detection

**Capabilities:**

- Multi-image brand constitution extraction
- Color palette detection with semantic meaning
- Typography pattern recognition
- Visual style classification (minimal, bold, playful, etc.)
- Voice/tone inference from captions/titles

**Output Schema:**

```typescript
interface BrandConstitution {
  visual_identity: {
    color_palette_hex: string[];
    color_meanings: Record<string, string>;
    typography_style: string;
    visual_density: 'minimal' | 'balanced' | 'dense';
    signature_elements: string[];
  };
  voice: {
    tone: string[];
    vocabulary_level: 'casual' | 'professional' | 'mixed';
    catchphrases: string[];
  };
  content_patterns: {
    thumbnail_structure: string;
    text_placement: string;
    face_prominence: 'high' | 'medium' | 'low' | 'none';
  };
  brand_essence: string; // 2-3 sentence summary
}
```

---

#### 3. Creative Director Agent

**Role:** Generate on-brand assets that match the creator's style.

**Trigger Conditions:**

- Asset generation requested
- Iteration on existing asset
- Style variation exploration

**Capabilities:**

- Brand-aware prompt engineering
- Multi-turn conversational editing
- Style transfer from constitution
- Variation generation (A/B testing)

**Context Requirements:**

- Active `BrandConstitution`
- Asset type template (thumbnail, banner, post)
- User's creative brief

**Gemini Features Used:**

- `gemini-3-pro-image-preview` for generation
- Multi-turn conversation for refinement
- Thought signatures for edit continuity

---

#### 4. Compliance Auditor Agent

**Role:** Verify generated assets match brand constitution.

**Trigger Conditions:**

- Asset generation complete
- Manual request for audit
- Pre-export verification

**Capabilities:**

- Visual similarity scoring
- Color palette adherence check
- Typography consistency verification
- Cross-asset cohesion analysis

**Output Schema:**

```typescript
interface AuditResult {
  overall_score: number; // 0-100
  passes: boolean; // score >= 80
  violations: Array<{
    category: 'color' | 'typography' | 'style' | 'composition';
    severity: 'critical' | 'major' | 'minor';
    description: string;
    suggestion: string;
  }>;
  strengths: string[];
}
```

**Enforcement Logic:**

- Score < 60: Block export, require regeneration
- Score 60-79: Warning with suggested fixes
- Score >= 80: Approved for export

---

#### 5. Trend Scout Agent

**Role:** Keep brand relevant with real-time awareness.

**Trigger Conditions:**

- Weekly automatic scan
- Pre-generation context enrichment
- Competitor analysis request

**Capabilities:**

- Google Search grounding for trends
- Platform-specific trend detection (YouTube, TikTok, Instagram)
- Competitor thumbnail analysis
- Seasonal/cultural event awareness

**Output Schema:**

```typescript
interface TrendContext {
  platform_trends: {
    platform: string;
    trending_styles: string[];
    trending_colors: string[];
    trending_formats: string[];
  }[];
  competitor_insights: {
    observation: string;
    opportunity: string;
  }[];
  seasonal_relevance: string[];
  recommendation: string;
}
```

**Gemini Features Used:**

- Google Search tool for grounding
- Multi-modal analysis for competitor visuals

---

#### 6. Context Memory Agent

**Role:** Maintain long-term brand memory and session continuity.

**Architecture:**

```
┌─────────────────────────────────────────────────────┐
│                 CONTEXT MEMORY                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐    ┌─────────────────┐        │
│  │  SESSION CACHE  │    │  BRAND MEMORY   │        │
│  │  (Short-term)   │    │  (Long-term)    │        │
│  │                 │    │                 │        │
│  │  • Conversation │    │  • Constitution │        │
│  │    history      │    │  • Approved     │        │
│  │  • Current task │    │    assets log   │        │
│  │  • Undo stack   │    │  • Style        │        │
│  │  • Thought      │    │    evolution    │        │
│  │    signatures   │    │  • Correction   │        │
│  │                 │    │    patterns     │        │
│  └─────────────────┘    └─────────────────┘        │
│           │                      │                 │
│           └──────────┬───────────┘                 │
│                      ▼                             │
│           ┌─────────────────┐                      │
│           │  LEARNING LOOP  │                      │
│           │                 │                      │
│           │  User corrects  │                      │
│           │  → Update pref  │                      │
│           │  → Refine const │                      │
│           └─────────────────┘                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Capabilities:**

- Thought signature preservation (Gemini 3 requirement)
- Conversation continuity across sessions
- Correction-based learning (user edits improve future outputs)
- Brand evolution tracking (how style changes over time)

**Persistence:**

- Session: In-memory + Zustand
- Long-term: Firestore per user/brand

---

#### 7. Export Optimizer Agent

**Role:** Prepare assets for specific platforms with optimal settings.

**Capabilities:**

- Platform-specific sizing (YouTube, Instagram, TikTok, Twitter)
- Resolution optimization (1080p, 2K, 4K)
- Format selection (PNG, JPEG, WebP, PDF)
- Batch export with naming conventions

**Platform Presets:**

```typescript
const PLATFORM_PRESETS = {
  youtube_thumbnail: { width: 1280, height: 720, format: 'png' },
  youtube_banner: { width: 2560, height: 1440, format: 'png' },
  instagram_post: { width: 1080, height: 1080, format: 'jpg' },
  instagram_story: { width: 1080, height: 1920, format: 'jpg' },
  tiktok_cover: { width: 1080, height: 1920, format: 'jpg' },
  twitter_header: { width: 1500, height: 500, format: 'png' },
  twitch_banner: { width: 1200, height: 480, format: 'png' },
};
```

---

## Core User Flows

### Flow 1: First-Time Brand Setup

```
┌──────────────────────────────────────────────────────────────────┐
│  CREATOR ONBOARDING (First-time setup, ~2 minutes)              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. CONTENT IMPORT                                               │
│     ─────────────────                                            │
│     • Upload 5-10 existing thumbnails/posts                      │
│     • OR paste social media profile URL (future)                 │
│     • OR drag & drop moodboard images                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. BRAND DNA EXTRACTION                     [Brand DNA Agent]   │
│     ──────────────────────                                       │
│     • AI analyzes all uploaded images                            │
│     • Extracts: colors, typography, style, patterns              │
│     • Shows visible thinking: "I notice you favor..."            │
│     • Duration: 15-30 seconds                                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. CONSTITUTION REVIEW                                          │
│     ─────────────────────                                        │
│     • Display extracted brand DNA with visual examples           │
│     • Creator confirms or adjusts (color picker, sliders)        │
│     • "This feels like me" confirmation                          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. BRAND MEMORY SAVED                       [Context Memory]    │
│     ────────────────────                                         │
│     • Constitution persisted to Firestore                        │
│     • Creator ready to generate                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Flow 2: Asset Generation

```
┌──────────────────────────────────────────────────────────────────┐
│  ASSET CREATION (Typical use, ~60 seconds)                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. CREATIVE BRIEF                                               │
│     ───────────────                                              │
│     • Select asset type (thumbnail, banner, post)                │
│     • Enter context: "New video about React hooks"               │
│     • Optional: reference image, specific requests               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. CONTEXT ENRICHMENT                                           │
│     ────────────────────                                         │
│     [Trend Scout] → Current platform trends                      │
│     [Context Memory] → Load brand constitution                   │
│     [Orchestrator] → Synthesize generation prompt                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. GENERATION                               [Creative Director] │
│     ────────────                                                 │
│     • Brand-aware prompt engineering                             │
│     • Generate 2-3 variations                                    │
│     • Show thinking: "Applying your color palette..."            │
│     • Duration: 10-20 seconds per variant                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. COMPLIANCE CHECK                         [Compliance Auditor]│
│     ─────────────────                                            │
│     • Each variant scored against constitution                   │
│     • Low scores flagged with visual diff                        │
│     • Auto-regenerate if score < 60                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. SELECTION & REFINEMENT                                       │
│     ────────────────────────                                     │
│     • Creator picks preferred variant                            │
│     • Optional: natural language edits ("make title bigger")     │
│     • Optional: canvas manual adjustments                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  6. EXPORT                                   [Export Optimizer]  │
│     ──────                                                       │
│     • Select platform preset                                     │
│     • One-click download at optimal resolution                   │
│     • Asset logged to brand memory for future reference          │
└──────────────────────────────────────────────────────────────────┘
```

### Flow 3: Iterative Editing (Canvas)

```
┌──────────────────────────────────────────────────────────────────┐
│  CANVAS EDITING (Refinement, variable duration)                  │
└──────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
            ▼                                   ▼
┌────────────────────────┐          ┌────────────────────────┐
│     MANUAL TOOLS       │          │     AI EDIT PANEL      │
│     ────────────       │          │     ─────────────      │
│     • Text editing     │          │     • Natural language │
│     • Shape tools      │          │       commands         │
│     • Drawing          │          │     • "Add sale badge" │
│     • Crop/resize      │          │     • "Remove bg"      │
│     • Mask selection   │          │     • "Make brighter"  │
│                        │          │                        │
│     [Fabric.js]        │          │     [Gemini 3 Pro Img] │
└────────────────────────┘          └────────────────────────┘
            │                                   │
            └─────────────────┬─────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  CONTEXT PRESERVATION                        [Context Memory]    │
│  ─────────────────────                                           │
│  • Thought signatures maintained across edits                    │
│  • Undo/redo stack with AI and manual actions                    │
│  • Session history for "continue where I left off"               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Business Model

### Pricing Strategy

| Tier | Price | Target | Features |
|------|-------|--------|----------|
| **Free** | $0/mo | Trial users | 5 generations/month, 1 brand, watermark |
| **Creator** | $12/mo | Nano creators | 50 generations/month, 1 brand, no watermark |
| **Pro** | $29/mo | Micro/mid creators | Unlimited generations, 3 brands, priority |
| **Studio** | $79/mo | Multi-channel creators | Unlimited everything, team access, API |

### Unit Economics (Target)

| Metric | Target |
|--------|--------|
| CAC (Customer Acquisition Cost) | < $30 |
| Monthly churn | < 8% |
| LTV (12-month) | > $150 |
| Gross margin | > 70% |

### Go-to-Market Strategy

**Phase 1: Product-Led Growth (Months 1-6)**

- Free tier for viral loops
- SEO: "YouTube thumbnail generator", "creator brand kit"
- Creator testimonials and case studies

**Phase 2: Community Building (Months 3-12)**

- Partner with creator education platforms
- Sponsor mid-tier YouTubers (20K-200K subs)
- Build Discord community for feedback loop

**Phase 3: Platform Expansion (Months 6-18)**

- Browser extension for one-click generation
- Figma/Canva plugin (complement, not compete)
- Mobile app for on-the-go edits

---

## Hackathon Strategy

### Demo Script (90 seconds)

**Setup (10 sec):**
> "Every successful YouTuber has a recognizable brand. But building that consistency takes a designer or years of discipline. Until now."

**Magic Moment (30 sec):**
> "I uploaded 6 thumbnails from a creator's channel. Watch as Sentient Studio extracts their brand DNA in real-time... colors, typography, visual style — all detected automatically."

**Generation (30 sec):**
> "Now I ask for a new thumbnail for 'React Hooks Explained'. The AI generates it in my exact style — not a generic template, but my brand. The compliance auditor confirms 92% brand match."

**Polish (10 sec):**
> "Quick edit: 'make the title pop more'. Done. Export at 4K. That's brand consistency for every creator — instantly."

**Close (10 sec):**
> "Sentient Studio: AI that doesn't just generate designs. It learns your brand and protects it."

### Judging Criteria Mapping

| Criterion | How We Score |
|-----------|--------------|
| **Technical Innovation** | Multi-agent orchestration, context memory, Gemini 3 native features |
| **Gemini Showcase** | Thinking mode, multi-modal analysis, function calling, search grounding |
| **Practical Impact** | Quantifiable: 5+ hours/week saved for creators |
| **Scalability** | Self-serve SaaS, applicable to 50M+ creators |
| **Polish** | 90-second demo, clear value prop, professional UI |

---

## Roadmap

### Hackathon MVP (Current)

- [x] Brand constitution extraction from images
- [x] Agentic generation with compliance loop
- [x] Hybrid canvas editor (manual + AI)
- [x] Mask-based inpainting
- [x] Multi-format export (PNG, PDF, up to 4K)
- [x] Visible thinking (reasoning display)
- [ ] Platform template presets (YouTube, Instagram, TikTok)
- [ ] Enhanced multi-agent orchestration

### Post-Hackathon (Months 1-3)

- [ ] User authentication (Firebase Auth)
- [ ] Persistent brand memory per user
- [ ] Social URL import (analyze channel directly)
- [ ] Batch generation (10 thumbnails at once)
- [ ] Usage analytics dashboard

### Growth Phase (Months 3-6)

- [ ] Team collaboration (shared brands)
- [ ] Browser extension
- [ ] A/B variant performance tracking
- [ ] Trend alerts (proactive suggestions)

### Scale Phase (Months 6-12)

- [ ] Mobile app
- [ ] API access for power users
- [ ] White-label for agencies
- [ ] Enterprise tier with SSO

---

## Environment Configuration

```env
# Required
GEMINI_API_KEY=           # Gemini 3 API key with frontier access

# Firebase (for persistence)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## Technical Constraints & Learnings

### Gemini 3 Gotchas (Documented from Development)

| Issue | Root Cause | Solution |
|-------|------------|----------|
| `responseSchema` ignored with images | Multimodal + schema conflict | Use prompt-based JSON + flexible parser |
| `thinkingConfig` + `responseSchema` conflict | API limitation | Don't use together; pick one |
| Thought signature required for function calls | Gemini 3 architecture | Preserve signatures in chat history |
| SSE cannot send 1MB+ payloads | HTTP limitation | Store images separately, send ID |
| In-memory store lost between instances | Next.js serverless | Use file-based or external cache |

### Performance Targets

| Operation | Target | Current |
|-----------|--------|---------|
| Brand extraction | < 30s | ~20s |
| Image generation | < 20s | ~15s |
| Compliance audit | < 10s | ~5s |
| Export (4K PNG) | < 5s | ~3s |

---

## Success Metrics

### Hackathon

- [ ] Complete demo without errors
- [ ] 90-second pitch delivery
- [ ] Visible "wow" moment (brand extraction)
- [ ] Clear differentiation from generic tools

### Startup (6-month targets)

- [ ] 1,000 registered users
- [ ] 100 paying customers
- [ ] < 10% monthly churn
- [ ] NPS > 40

---

*Last Updated: 2026-02-08*
*Version: 2.0 — Creator Brand Wedge*
