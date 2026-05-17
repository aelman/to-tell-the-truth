# To Tell The Truth — Game Show Dashboard

A live, single-page React dashboard for the "To Tell The Truth" AI voice game show. Connects to an OpenHome agent over WebSocket and visualizes each phase of the game in real time.

## Run & Operate

- `pnpm --filter @workspace/tttt-dashboard run dev` — run the dashboard (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: `VITE_OPENHOME_WS_URL` — your OpenHome agent WebSocket URL (e.g. `wss://your-agent.openhome.xyz/ws`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS
- Fonts: Playfair Display (headings/verdict), Inter (body)
- Animations: framer-motion, CSS transitions, canvas-confetti (verdict)
- WebSocket: custom hook with exponential back-off reconnect

## Where things live

- `artifacts/tttt-dashboard/src/App.tsx` — main app, phase-driven rendering
- `artifacts/tttt-dashboard/src/hooks/useOpenHomeSocket.ts` — WebSocket + reconnect logic
- `artifacts/tttt-dashboard/src/components/` — ShowTitle, TopicPill, ConnectionStatus, ContestantCard, QuestionFeed, VerdictPanel
- `artifacts/tttt-dashboard/src/index.css` — color palette (dark indigo + gold), Google Fonts import
- `artifacts/tttt-dashboard/.env.example` — env var template

## Architecture decisions

- Pure frontend — no backend, no database. All game state arrives via WebSocket messages.
- Single `gameState` object replaced/merged on each incoming `tttt_state` message.
- Phase-driven rendering: the `phase` field in game state controls which panels are visible/active.
- Exponential back-off reconnect: 1s → 2s → 4s → … capped at 30s.
- State resets to `intro` when phase returns to `"intro"` or user clicks "Play Again".

## Product

Real-time game show dashboard with:
- Intro screen with pulsing microphone while waiting for topic
- Topic reveal pill with spinner during question generation
- Questions list with 150ms staggered fade-in
- Contestant cards with active gold glow, dimmed inactive state
- Scrollable Q&A feed with blue (C1) / purple (C2) answer borders and blinking "awaiting answer" cursor
- "Deliberating" panel with rotating gold ring animation
- Verdict reveal with count-up score animation, winner announcement, confetti burst
- Live/Disconnected status pill in top-right corner

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Google Fonts `@import url(...)` must be the very first line of `index.css` — PostCSS fails silently otherwise.
- `VITE_OPENHOME_WS_URL` must be set; app logs a warning but degrades gracefully (stays on intro screen).
- The WebSocket URL must be prefixed with `wss://` (not `ws://`) for production OpenHome endpoints.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
