# Scrum Poker

Real-time planning poker for agile teams. Create a room, share the link, and estimate together.

## Features

- **Real-time voting** — Fibonacci (0, 1, 2, 3, 5, 8, 13, 21...) and T-Shirt (XS, S, M, L, XL, XXL) scales
- **Story tracking** — Host adds/edits/deletes stories; team estimates them in order; completed stories retain their final point
- **Session summary** — When all stories are estimated, shows total points and a full results table
- **Spectator mode** — Join as a spectator to observe without voting
- **Room management** — Create rooms with a 6-character code, invite via link
- **Host controls** — Reveal votes, start new rounds, auto host transfer on disconnect
- **Jira URL paste** — Pasting a Jira ticket URL in the story input auto-extracts the ticket ID (e.g. `PROJ-123`)
- **Emoji reactions** — 13 emojis with unique sounds and floating animations
- **Quick chat** — Predefined messages + custom input with text-to-speech (English & Thai)
- **Sound notifications** — Chime when all voted, fanfare on reveal, per-emoji sounds
- **Browser tab notifications** — Tab title updates when votes are revealed or all players voted
- **Mute toggle** — Disable all sounds and TTS, persisted across sessions
- **Dark/Light theme** — Toggle between dark and light mode, persisted across sessions
- **Auto reconnect** — Rejoin rooms automatically after connection loss or page refresh

## Tech Stack

- **Frontend:** Next.js 16.2.3, React 19, TypeScript, Tailwind CSS 4
- **Real-time:** Socket.IO 4
- **Server:** Custom Node.js server with tsx
- **Testing:** Vitest, Testing Library, happy-dom
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

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | — | Set to `production` for the production server |
| `NEXT_PUBLIC_SITE_URL` | `https://scrum-poker.devonly.dev` | Base URL used in `sitemap.xml` and `robots.txt` |

## Project Structure

```
src/
  app/
    page.tsx                    # Home — create/join room
    sitemap.ts                  # /sitemap.xml (uses NEXT_PUBLIC_SITE_URL)
    robots.ts                   # /robots.txt (disallows /room/ and /join/)
    room/[id]/
      page.tsx                  # Voting room orchestrator
      RoomHeader.tsx            # Room title, ID, voting system, host controls
      PlayerArea.tsx            # Player card grid layout
      PlayerCard.tsx            # Individual player card with vote & emoji
      VotingDeck.tsx            # Vote option buttons
      VoteStats.tsx             # Vote statistics after reveal
      InteractionBar.tsx        # Chat and emoji panel
      StoryList.tsx             # Sidebar story queue with add/edit/delete
      SummaryPage.tsx           # All-done screen with total points
      EmptyRoom.tsx             # Prompt shown when no stories exist yet
    join/[id]/page.tsx          # Invite join page
    layout.tsx                  # Root layout
    globals.css                 # Animations & global styles
  components/
    ThemeToggle.tsx              # Dark/light theme toggle button
  lib/
    socket.ts                   # Socket.IO client singleton
    sounds.ts                   # Sound effects & TTS
    theme.tsx                   # Theme provider (localStorage-persisted)
    room-utils.ts               # Room ID generation, vote masking, voting systems
  types/
    index.ts                    # TypeScript interfaces & constants
  __tests__/                    # Vitest test suites
server.ts                       # Custom Socket.IO + Next.js server
Dockerfile                      # Multi-stage production build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
