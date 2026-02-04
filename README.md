# Sentient Studio

> AI-powered marketing asset generator with autonomous agents that understand your brand DNA.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.0-blue)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org)

## What Makes This Special

**This is NOT a Gemini wrapper.** It's a true agentic system where AI autonomously decides what to do.

| Feature | How It Works |
|---------|-------------|
| **Function Calling** | AI chooses which tool to use next |
| **Thinking Mode** | Visible AI reasoning in real-time |
| **Self-Correcting** | Auto-retry until compliance passes |
| **Memory** | Remembers brand rules across sessions |
| **Nano Banana** | Native Gemini image generation |

## Demo Flow

```
1. Upload moodboard → Canvas
2. AI extracts → Brand Constitution
3. Request asset → "Summer sale poster"
4. Agent thinks → Visible reasoning
5. Generates → Real image via Nano Banana
6. Audits → Brand compliance check
7. Retries → If score < 90%
8. Delivers → Final approved asset
```

## Quick Start

```bash
# Clone
git clone https://github.com/Zhav1/sentient-studio.git
cd sentient-studio

# Install
npm install

# Configure
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Run
npm run dev
```

Open <http://localhost:3000>

## Architecture

```
┌─────────────────────────────────────────────┐
│              Next.js 15 (Vercel)            │
├─────────────────────────────────────────────┤
│   Canvas     │   Dashboard   │   Landing    │
├─────────────────────────────────────────────┤
│           /api/agent (SSE Stream)           │
├─────────────────────────────────────────────┤
│        AGENT ORCHESTRATOR (Function Calling)│
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ analyze  │→│ generate │→│   audit     │  │
│  │ _canvas  │ │ _image   │ │ _compliance │  │
│  └──────────┘ └──────────┘ └─────────────┘  │
│       ↑              ↓                      │
│       └── refine_prompt ←───────────────────│
├─────────────────────────────────────────────┤
│   Gemini 2.0 Flash + Nano Banana + Thinking │
└─────────────────────────────────────────────┘
```

## Available Tools

The agent autonomously chooses from:

| Tool | Purpose |
|------|---------|
| `analyze_canvas` | Extract brand DNA from moodboard |
| `generate_image` | Create images via Nano Banana |
| `audit_compliance` | Check brand guideline adherence |
| `refine_prompt` | Fix issues and retry generation |
| `search_trends` | Web search for design inspiration |
| `complete_task` | Signal task completion |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: Gemini 2.0 Flash + Nano Banana
- **State**: Zustand
- **Database**: Firestore
- **Styling**: Tailwind CSS
- **Drag & Drop**: dnd-kit

## Environment Variables

```env
GEMINI_API_KEY=       # Required - Gemini API key
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

## License

MIT
