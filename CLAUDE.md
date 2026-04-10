@AGENTS.md

# Scrum Poker

Real-time planning poker app built with Next.js 16.2, React 19, Socket.IO 4, and Tailwind CSS 4.

## Architecture

- **Custom server** — `server.ts` runs a Node.js HTTP server with Socket.IO alongside Next.js. All real-time state is managed here via in-memory `Map<string, Room>`.
- **No database** — Room/player state is in-memory only. Lost on server restart.
- **No REST API** — All communication is event-driven via WebSocket (Socket.IO).

## Key Files

- `server.ts` — Socket.IO server, room management, all game logic (~270 lines)
- `src/app/page.tsx` — Home page (create/join room)
- `src/app/room/[id]/page.tsx` — Main voting room orchestrator (~310 lines)
- `src/app/room/[id]/RoomHeader.tsx` — Room title, ID, voting system selector, host controls
- `src/app/room/[id]/PlayerArea.tsx` — Grid layout of player cards
- `src/app/room/[id]/PlayerCard.tsx` — Individual player card with vote display and emoji
- `src/app/room/[id]/VotingDeck.tsx` — Vote option buttons
- `src/app/room/[id]/VoteStats.tsx` — Vote statistics after reveal
- `src/app/room/[id]/InteractionBar.tsx` — Chat and emoji interaction panel
- `src/app/join/[id]/page.tsx` — Invite join page
- `src/lib/socket.ts` — Socket.IO client singleton
- `src/lib/sounds.ts` — Web Audio API sounds + Web Speech API TTS
- `src/lib/theme.tsx` — Light/dark theme provider (persists to localStorage)
- `src/lib/room-utils.ts` — Room ID generation, vote masking, voting system lookup
- `src/components/ThemeToggle.tsx` — Sun/moon theme toggle button
- `src/types/index.ts` — Shared TypeScript interfaces (Room, Player, RoomState)

## Commands

- `npm run dev` — Start dev server (tsx server.ts)
- `npm run build` — Build for production (next build)
- `npm start` — Start production server (NODE_ENV=production tsx server.ts)
- `npm run lint` — Run ESLint
- `npm test` — Run tests (vitest run)
- `npm run test:watch` — Run tests in watch mode
- `npm run test:coverage` — Run tests with coverage

## Socket Events

**Client → Server:** `create-room`, `join-room`, `rejoin-room`, `get-room-state`, `vote`, `reveal-votes`, `reset-votes`, `send-emoji`, `send-chat`

**Server → Client:** `room-update`, `vote-update`, `player-emoji`, `player-chat`

## Important Patterns

- Room IDs are always uppercase 6-char alphanumeric (generated in `generateRoomId`)
- `votingSystem` is stored as `string[]` on the room — Fibonacci or T-Shirt values
- Vote masking: server sends `'voted'` instead of actual vote value until `revealed === true`
- Host auto-transfers to first remaining player on disconnect
- Empty rooms are kept for 60s grace period (allows refresh/rejoin), then cleaned up
- TTS requires macOS system voices installed (Accessibility > Spoken Content > Manage Voices)
- Theme (light/dark) is stored in `localStorage('theme')` and toggled via `.dark` class on `<html>`
- Dockerfile production stage must explicitly COPY any `src/lib/` files imported by `server.ts` (standalone output doesn't include them)
