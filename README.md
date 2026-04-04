# Scrum Poker

Real-time planning poker for agile teams. Create a room, share the link, and estimate together.

## Features

- **Real-time voting** — Fibonacci (0, 1, 2, 3, 5, 8, 13, 21...) and T-Shirt (XS, S, M, L, XL, XXL) scales
- **Room management** — Create rooms with a 6-character code, invite via link
- **Host controls** — Reveal votes, start new rounds, auto host transfer on disconnect
- **Emoji reactions** — 13 emojis with unique sounds and floating animations
- **Quick chat** — Predefined messages + custom input with text-to-speech (English & Thai)
- **Sound notifications** — Chime when all voted, fanfare on reveal, per-emoji sounds
- **Browser tab notifications** — Tab title updates when votes are revealed or all players voted
- **Mute toggle** — Disable all sounds and TTS, persisted across sessions
- **Auto reconnect** — Rejoin rooms automatically after connection loss or page refresh

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Real-time:** Socket.IO 4
- **Server:** Custom Node.js server with tsx
- **Audio:** Web Audio API + Web Speech API (no external files)

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t scrum-poker .
docker run -p 3000:3000 scrum-poker
```

## Project Structure

```
src/
  app/
    page.tsx              # Home — create/join room
    room/[id]/page.tsx    # Voting room
    join/[id]/page.tsx    # Invite join page
    layout.tsx            # Root layout
    globals.css           # Animations & global styles
  lib/
    socket.ts             # Socket.IO client singleton
    sounds.ts             # Sound effects & TTS
  types/
    index.ts              # TypeScript interfaces & constants
server.ts                 # Custom Socket.IO + Next.js server
Dockerfile                # Multi-stage production build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
