# LiveLook — Real-Time Virtual Try-On

At Google I/O 2026, Demis Hassabis highlighted DeepMind's focus on World Models as a critical step toward AGI. With real-time video editing via natural language already here, it got me thinking about the immediate applications for entirely new, dynamic user interfaces — and the fitting room was the first thing that came to mind.

What if we could replace crowded, busy fitting rooms in retail stores with intelligent screens?

**LiveLook** is a real-time virtual try-on app that completely changes the browsing experience. It uses real-time video diffusion to render garments onto you — live, as you move.


## How It Works

- **Real-time garment rendering** — Uses the Lucy VTON model (by [Decart](https://decart.ai)) to render clothing onto a live webcam feed in real time via WebRTC.
- **Gesture-based browsing** — Swipe your hand to browse the product catalog and give a thumbs up or OK sign to add items to your cart, all powered by [Google MediaPipe](https://ai.google.dev/edge/mediapipe).
- **Voice control** — Search for products by speaking, using the Web Speech API.
- **Zero UI friction** — No buttons needed. Browse, try on, and shop entirely through natural gestures.

## Tech Stack

- **Next.js** (App Router) — Frontend and API routes
- **Decart SDK** (`@decartai/sdk`) — Real-time video diffusion streaming
- **MediaPipe Tasks Vision** — Hand landmark detection and gesture recognition
- **Web Speech API** — Voice-controlled product search
- **Tailwind CSS** — Styling

## Getting Started

```bash
# Install dependencies
npm install

# Add your Decart API key
echo "DECART_API_KEY=your_key_here" > .env.local

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and allow camera access.

Get a Decart API key at [platform.decart.ai](https://platform.decart.ai).

## License

MIT
