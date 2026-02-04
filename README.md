# Sentient Studio

> AI-powered marketing asset generator featuring autonomous agents built with **Gemini 3**.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Gemini 3](https://img.shields.io/badge/Gemini-3-blue)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org)

## What Makes This Special

**Frontier Intelligence.** We use Gemini 3's native reasoning and image generation to create high-fidelity marketing assets autonomously.

| Usage | Model | Key Capability |
| :--- | :--- | :--- |
| **Default/Loop** | `gemini-3-flash-preview` | Frontier speed + High thinking |
| **Image (Pro)** | `gemini-3-pro-image-preview` | 4K resolution + Advanced text |
| **Search/Trends** | `gemini-3-flash-preview` | Google Search grounding |
| **Reasoning** | Unified `gemini-3` | Native `thinkingConfig` |

## Demo Flow

```text
1. Upload moodboard → Canvas
2. AI extracts → Brand Constitution (Gemini 3)
3. Request asset → "Cyberpunk sale banner"
4. Agent thinks → Visible HIGH reasoning
5. Generates → Pro-grade image (Nano Banana Pro)
6. Audits → Brand compliance check
7. Retries → Autonomous self-correction
8. Delivers → 4K Approved Asset
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

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: Gemini 3 Flash & Pro (Preview)
- **State**: Zustand
- **Database**: Firestore
- **Styling**: Tailwind CSS
- **Grounding**: Google Search API

## License

MIT
