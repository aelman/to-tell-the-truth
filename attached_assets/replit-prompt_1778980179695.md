# Replit Prompt — "To Tell The Truth" Game Show Dashboard

Build a full-stack web app (Node.js + Express backend, React + Vite + Tailwind CSS frontend) that serves as a live game show dashboard for the "To Tell The Truth" AI voice game.

The OpenHome ability running on a separate device sends HTTP POST requests to this Replit server whenever the game state changes. The server relays those events over WebSocket to all connected browser clients, which then render the live dashboard.

---

## Architecture

```
OpenHome Ability
  │  POST /event  (JSON body + x-webhook-secret header)
  ▼
Express server (server.js)  ←── runs on Replit, port 3001
  │  broadcast over WebSocket
  ▼
Browser clients  ←── connect to wss://your-app.replit.dev/ws
  │  render game state
  ▼
React UI (Vite dev server proxies /ws and /event to Express)
```

---

## Backend — `server.js`

Use **Express** + the **ws** package. The server must:

1. **`POST /event`** — receive game-state updates from the OpenHome ability.
   - Validate the `x-webhook-secret` header against `process.env.WEBHOOK_SECRET`.
   - If the header is missing or wrong, return 401.
   - Parse the JSON body and broadcast it as a string to all connected WebSocket clients whose `readyState` is `OPEN`.
   - Return `{ ok: true }`.

2. **WebSocket server at path `/ws`** — browser clients subscribe here.
   - On connection, send the most recent game-state event (cached in memory as `lastEvent`) so a page reload immediately shows the current state.
   - No authentication needed on the WebSocket side.

3. Serve the Vite production build from `./dist` for all other GET requests.

4. Listen on `process.env.PORT || 3001`.

---

## Vite Proxy (development only)

In `vite.config.js`, proxy both `/event` and `/ws` to `http://localhost:3001` so the React dev server and the Express server work together locally:

```js
server: {
  proxy: {
    '/event': 'http://localhost:3001',
    '/ws': { target: 'ws://localhost:3001', ws: true },
  },
},
```

---

## WebSocket Hook — `src/hooks/useGameSocket.js`

Connect to `/ws` (relative path — works both locally via the Vite proxy and in production on Replit). Reconnect automatically with exponential back-off (1 s, 2 s, 4 s … capped at 30 s). On each message, parse the JSON and call `onEvent(data)`. Expose a `status` value: `"connected"` | `"disconnected"` | `"reconnecting"`.

Show a small status pill in the top-right corner of the app: green "LIVE" when connected, amber "RECONNECTING…", red "DISCONNECTED" otherwise.

---

## Overall Visual Style

- Dark background (#0d0d1a — near-black indigo)
- Gold accent (#f5c518 — classic game show gold)
- White text for primary content, gray-400 for secondary
- Bold serif headline font (Google Fonts: "Playfair Display") for the show title and verdict
- Clean sans-serif (Inter) for question/answer text
- Rounded cards with subtle glows for active elements
- Confetti burst (canvas-confetti) on the verdict reveal

---

## Layout

```
┌────────────────────────────────────────────────────────┐
│  🎙  TO TELL THE TRUTH         Topic pill      [LIVE] │
├───────────────────────┬────────────────────────────────┤
│    CONTESTANT 1       │    CONTESTANT 2                │
│    Score card         │    Score card                  │
├───────────────────────┴────────────────────────────────┤
│               Question Feed (scrollable)               │
├────────────────────────────────────────────────────────┤
│                    VERDICT PANEL                       │
└────────────────────────────────────────────────────────┘
```

On mobile, stack all panels vertically.

---

## Phases & What to Show

The incoming `data.phase` field (broadcast from the server) drives which panel is visible/active. All game state lives in a single `gameState` object updated on each event.

### `"intro"`
Show the show title full-screen with a pulsing microphone icon and "Waiting for topic…"

### `"topic_chosen"` / `"generating_questions"`
Display the topic in a large gold pill. Show a spinner with "Generating questions…"

### `"questions_ready"`
Show all 5 questions in a numbered list under "Today's Questions". Fade them in one by one with a 150 ms stagger.

### `"player_intro"`
Highlight the active contestant card (golden border glow). Dim the inactive one.

### `"question_asked"`
In the Question Feed, add a new row showing the question number and text. Mark it "awaiting answer…" with a blinking cursor.

### `"answer_received"`
Populate the current row with the player's answer. Blue left-border for Contestant 1, purple for Contestant 2. Also show a compact version inside the contestant's card.

### `"evaluating"`
Show a centered overlay: "The panel is deliberating…" with a slow rotating gold ring.

### `"verdict"`
Dramatic reveal:
1. Show both score cards side by side with animated count-up numbers for Accuracy, Depth, and Confidence (each 0–10).
2. Show the one-sentence reasoning below each card in italics.
3. After a 1.5 s delay, flash the verdict panel: bold **"THE REAL EXPERT IS — CONTESTANT [N]"** in large Playfair Display gold text.
4. Show the explanation sentence in white below.
5. Fire confetti.
6. Show a "Play Again" button that resets state to `intro`.

---

## Contestant Score Card Component

Each card shows:
- "CONTESTANT 1" / "CONTESTANT 2" header
- Three score bars: Accuracy, Depth, Confidence (width animates from 0 → value/10 × 100%)
- Total score badge (e.g. "24 / 30")
- Reasoning sentence (italic, visible only during verdict phase)
- Active gold glow border when it's their turn to answer

---

## Question Feed Component

Scrollable panel (max-height ~40 vh on desktop, 50 vh on mobile). Each entry:

```
Q3 ────────────────────────────────────────────────────
   What is the Maillard reaction and why does it matter?
   ╔ C1 ▸  It's the browning reaction between amino acids and sugars…
   ╚ C2 ▸  [awaiting answer…]
```

Auto-scroll to the bottom on new content. Keep all previous Q&A visible.

---

## State Reset

When phase returns to `"intro"`, clear all game state and restart the intro animation.

---

## Environment Variables

```
# .env (server)
WEBHOOK_SECRET=choose-a-long-random-string
PORT=3001

# .env (used at Vite build time — not needed if you only use relative /ws)
# VITE_WS_PATH=/ws
```

Provide a `.env.example` with these variables and comments. The `WEBHOOK_SECRET` must match the `replit_webhook_secret` API key set in the OpenHome ability's dashboard.

---

## File Structure

```
/
├── server.js                        ← Express + WebSocket relay server
├── index.html
├── .env.example
├── vite.config.js
├── tailwind.config.js
├── package.json                     ← include "start": "node server.js"
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── hooks/
    │   └── useGameSocket.js         ← WebSocket + reconnect logic
    └── components/
        ├── ShowTitle.jsx
        ├── TopicPill.jsx
        ├── ContestantCard.jsx
        ├── QuestionFeed.jsx
        └── VerdictPanel.jsx
```

---

## Dependencies

**Runtime:**
- express
- ws

**Frontend:**
- react, react-dom
- vite, @vitejs/plugin-react
- tailwindcss, autoprefixer, postcss
- canvas-confetti

No UI component library — build everything with Tailwind utilities.

---

## Replit Configuration

In `.replit`, set the run command to:
```
node server.js
```

The Vite build (`npm run build`) should run first to populate `./dist`. Add a `build` step or instruct the user to run `npm run build` before starting the server.
