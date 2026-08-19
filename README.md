# Juan (J1 AI)

> **Digital AI Clone & Conversational Talking Avatar of Rafito Juan**  
> Powered by Mistral AI, custom WebGL Chroma Key Shader, real-time Tavily Web Search Grounding, and installable Progressive Web App (PWA) architecture.

---

## The Why (Vision & Mental Model)

Most conversational AI chatbots are generic, impersonal text boxes that sound like corporate customer service bots and struggle with static training cutoffs.

**Juan (J1)** was built to explore a more authentic paradigm for personal AI twins:
1. **Visual Immersion without 3D Overhead**: Uses a custom WebGL fragment shader to perform dynamic green-screen chroma keying directly on 1080p MP4 video frames in real time, seamlessly blending a talking video avatar with an idle state without heavy 3D game engines.
2. **Authentic Persona vs AI Slop**: Retains Rafito Juan's real-world identity, Jakarta conversational cadence (`lu-gua`), deep Arsenal FC fandom, music tastes, and software engineering background while strictly forbidding robotic corporate disclaimers and emoji spam.
3. **Live Web Grounding**: Bridges LLM temporal limitations by routing factual and entity-based inquiries to Tavily Search API with dynamic temporal anchoring.
4. **Native App Experience**: Operates as a standalone Progressive Web App (PWA) installable on Android, iOS, and desktop with offline app-shell caching.

---

## 🏛️ System Architecture

```
┌─────────────────┐
│   User Prompt   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Smart Intent & Search Router                │
│  - Personal / Persona Query   ──▶ Skip Web (Internal Memory)│
│  - Factual / Live / News Query ──▶ Tavily Search API Engine │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Mistral AI Streaming Engine               │
│  - Dynamic Date & Temporal Anchoring                        │
│  - Strict Anti-Hallucination & Fact-Grounding Rules         │
│  - SSE (Server-Sent Events) Token Stream                    │
└────────┬────────────────────────────────────────────────────┘
         │
    ┌────┴─────────────────────────────┐
    │                                  │
    ▼                                  ▼
┌─────────────────────────┐   ┌─────────────────────────────┐
│   WebGL Chroma Shader   │   │   Chat UI & Markdown Engine │
│  - Green screen removal │   │  - Highlight.js code blocks │
│  - Edge despill filter  │   │  - Auto-scroll sync         │
│  - Idle PNG / Video swap│   │  - Web Audio UI sound FX    │
└─────────────────────────┘   └─────────────────────────────┘
```

---

## Core Features

- **Real-Time Talking Avatar (WebGL Chroma Key)**:
  - Custom GLSL fragment shader eliminates solid green background in real time using adjustable similarity, edge smoothness, and green despill parameters.
  - Automatically transitions between idle PNG and looping speech video based on streaming token lifecycle.
- **Tavily Live Web Search Grounding**:
  - Automatically searches the live web for current events, football scores, tech updates, and factual questions.
  - Multi-engine fallback to Wikipedia Full-Text Search and DuckDuckGo Instant Answers.
  - Scaled low-temperature inference (`0.25`) during grounded queries to prevent hallucinations.
- **Authentic Persona Engine**:
  - Natural Jakarta conversational style with contextual adaptability (technical problem solving, casual roasting, deep Arsenal discussions, and roleplay modes).
- **Progressive Web App (PWA)**:
  - Full standalone installability on mobile (Android/iOS) and desktop.
  - Precision 1:1 square maskable and adaptive icons (`icon-512.png`, `icon-192.png`, `apple-touch-icon.png`).
  - Service Worker (`sw.js`) with cache-first static asset delivery and network-first API streaming bypass.
- **Design System & Accessibility (Impeccable Standard)**:
  - Dark Zinc design tokens (`#09090b`), WCAG 2.2 AA compliant contrast, `@media (prefers-reduced-motion: reduce)`, and complete ARIA roles.

---

## Quickstart

### Prerequisites
- **Node.js**: v18.0.0 or later
- **npm** or **pnpm** / **bun**

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/rafitojuan/juan-chatbot.git
cd juan-chatbot
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Fill in your API keys in `.env`:
```ini
VITE_MISTRAL_API_KEY=your_mistral_api_key_here
VITE_TAVILY_API_KEY=your_tavily_api_key_here
```

> **Note**: If `VITE_TAVILY_API_KEY` is not provided, the search engine automatically falls back to free Wikipedia and DuckDuckGo search.

### 3. Run Locally
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## Subsystem Boundaries

```
juan-ai/
├── public/
│   ├── assets/
│   │   ├── images/         # PWA square icons (192, 512, maskable) & idle avatar PNG
│   │   ├── videos/         # Chroma key talking video loop (juanhead.mp4)
│   │   └── audio/          # UI sound effects (pop, send, success)
│   ├── manifest.webmanifest# PWA manifest metadata & standalone rules
│   └── sw.js               # Service Worker caching & network strategy
├── src/
│   ├── api.js              # Mistral AI client & J1 system prompt persona engine
│   ├── chromakey.js        # WebGL shader controller & canvas video renderer
│   ├── search.js           # Tavily & Wikipedia live search grounding pipeline
│   ├── chat.js             # Chat state, markdown parser, & message DOM manager
│   ├── audio.js            # Web Audio API sound effect synthesizer
│   └── main.js             # Application lifecycle orchestrator & event bus
├── index.html              # Core semantic HTML5 layout & PWA meta headers
├── style.css               # Design system tokens, responsive layout, & animations
└── DESIGN.md               # Visual design tokens & typography specification
```

---

## Configuration Reference

| Environment Variable | Description | Required |
| :--- | :--- | :---: |
| `VITE_MISTRAL_API_KEY` | API Key from [Mistral AI Console](https://console.mistral.ai/) | **Yes** |
| `VITE_TAVILY_API_KEY` | API Key from [Tavily Search API](https://tavily.com/) | Optional (Recommended) |

---

## License

Created by **Rafito Juan**. Distributed under the [MIT License](LICENSE).
