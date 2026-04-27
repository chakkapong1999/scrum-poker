'use client';

import type { Player } from '@/types';
import { PlayerCard } from './PlayerCard';
import type { FloatingEmoji, ChatBubble } from './PlayerCard';

export function PlayerArea({ players, revealed, floatingEmojis, chatBubbles }: Readonly<{
  players: Player[];
  revealed: boolean;
  floatingEmojis: Map<string, FloatingEmoji[]>;
  chatBubbles: Map<string, ChatBubble[]>;
}>) {
  return (
    <div className="player-grid stagger" style={{ width: '100%', maxWidth: 920 }}>
      {players.map(p => (
        <PlayerCard
          key={p.id}
          player={p}
          revealed={revealed}
          floatingEmojis={floatingEmojis.get(p.id) || []}
          chatBubbles={chatBubbles.get(p.id) || []}
        />
      ))}
    </div>
  );
}
