# Sentient Studio

> AI-powered marketing asset generator with **Hybrid Canvas Editor** — built with **Gemini 3**.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Gemini 3](https://img.shields.io/badge/Gemini-3-blue)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org)

## What Makes This Special

🚀 **Frontier Intelligence.** Gemini 3's native reasoning + image generation creates autonomous marketing agents.

🎨 **Hybrid Canvas Editor.** Edit AI-generated images manually OR via natural language — powered by Gemini 3 Pro Image's multi-turn editing.

| Model | Usage | Capability |
|-------|-------|------------|
| `gemini-3-flash-preview` | Agent Loop, Search | High-speed reasoning |
| `gemini-3-pro-image-preview` | Image Gen + AI Edit | 4K output, multi-turn editing |

## Demo Flow

```text
1. Upload moodboard     → Canvas
2. AI extracts          → Brand Constitution (colors, style, forbidden elements)
3. Request asset        → "Cyberpunk sale banner"
4. Agent reasons        → Visible thinking process
5. Generates image      → 4K Pro-grade asset (Nano Banana Pro)
6. Audits compliance    → Brand safety check
7. Self-corrects        → Autonomous retry if needed
8. [NEW] Edit in Canvas → Add text, shapes, OR AI prompts
9. Export               → PNG/PDF at any resolution
```

## Key Features

### 🤖 Autonomous Agent

- **Brand Constitution** — AI extracts visual DNA from your moodboard
- **Agentic Loop** — Generate → Audit → Refine → Deliver
- **High Thinking** — Visible reasoning for transparency

### 🎨 Canvas Editor

- **Manual Tools** — Text, shapes, draw (Fabric.js)
- **AI Edit** — "Add a sale badge" → Gemini edits the image
- **🎭 Mask Inpainting** — Select regions with brush/rectangle, AI edits only inside
- **Multi-turn** — Keep editing with context preserved

### 📤 Export

- **Multiple Formats** — PNG, JPEG, PDF
- **Resolution Control** — 1K to 4K output
- **Brand Kit** — Save to your asset library

## Quick Start

```bash
git clone https://github.com/Zhav1/sentient-studio.git
cd sentient-studio
npm install
echo "GEMINI_API_KEY=your_key_here" > .env.local
npm run dev
```

Open <http://localhost:3000>

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: Gemini 3 Flash & Pro Image (Preview)
- **Canvas**: Fabric.js 6
- **State**: Zustand
- **Database**: Firestore
- **Styling**: Tailwind CSS
- **Grounding**: Google Search API

## License

MIT
