# Project Status: Sentient Studio

> Last Updated: 2026-02-04 16:00 (UTC+7)

## Current Phase: ✅ AGENTIC SYSTEM COMPLETE

---

## What Makes This Agentic (Not a Wrapper)

| Before (Wrapper) | After (Agentic) |
|------------------|-----------------|
| User clicks → API call → Display | AI **decides** what to do next |
| Sequential manual calls | **Function calling** - AI chooses tools |
| Returns text prompts | **Generates real images** with Nano Banana |
| No reasoning visible | **Real-time activity feed** shows AI working |
| Manual retry | **Self-correcting loop** until audit passes |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 (Vercel)                  │
├─────────────────────────────────────────────────────────┤
│  Landing Page │ Canvas (Moodboard) │ Agent Dashboard    │
├─────────────────────────────────────────────────────────┤
│              /api/agent (Streaming SSE)                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │        AGENT ORCHESTRATOR (Function Calling)    │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │    │
│  │  │ analyze  │→│ generate │→│ audit_compliance │ │    │
│  │  │ _canvas  │ │ _image   │ │                  │ │    │
│  │  └──────────┘ └──────────┘ └──────────────────┘ │    │
│  │        ↑                           │            │    │
│  │        └───── refine_prompt ←──────┘ (if fail) │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│         Gemini 2.0 Flash + Nano Banana (Image Gen)      │
└─────────────────────────────────────────────────────────┘
```

---

## Files Created

### Core Agentic System

| File | Purpose |
|------|---------|
| `lib/ai/tools.ts` | Function calling tool definitions |
| `lib/ai/gemini.ts` | Agent orchestrator with loop |
| `app/api/agent/route.ts` | Streaming SSE endpoint |
| `app/dashboard/page.tsx` | Real-time agent activity UI |

### Foundation

| File | Purpose |
|------|---------|
| `app/page.tsx` | Landing page |
| `app/canvas/page.tsx` | Moodboard with dnd-kit |
| `components/canvas/*` | Canvas components |
| `lib/store/*` | Zustand state management |
| `lib/firebase/*` | Firestore config |

---

## The "Wow" Demo Flow

1. **User types**: "Create a summer sale poster"
2. **Agent Feed shows**:
   - 🔍 Analyzing your moodboard to understand brand DNA...
   - 🎨 Generating image with Nano Banana...
   - 🛡️ Auditing image against brand guidelines...
   - ✏️ Refining prompt based on audit feedback... (if needed)
   - ✅ Task complete!
3. **Image appears** in real-time on dashboard

---

## How to Run

```bash
# 1. Add your Gemini API key
echo "GEMINI_API_KEY=your_key" > .env.local

# 2. Start dev server
npm run dev

# 3. Open http://localhost:3000
```

---

## Key Gemini Capabilities Used

1. **Function Calling** - AI autonomously decides which tool to use
2. **Compositional Calling** - Chains: analyze → generate → audit → refine
3. **Nano Banana** - Native image generation (gemini-2.0-flash-exp)
4. **Vision** - Audits generated images for compliance
