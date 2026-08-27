'use client';

import { useRef, useState, type ReactNode } from 'react';

const SIZE = 56;
const PANEL_W = 280;
const PANEL_H = 240;
const clamp = (v: number, max: number) => Math.min(Math.max(v, 8), Math.max(8, max));

// ponytail: position is per-mount and drag-only (no keyboard move) — persist to
// localStorage / add arrow-key nudging only if someone actually asks.
export function FloatingButton({
  label,
  image,
  description,
  children,
}: {
  label: string;
  image: string;
  description: string;
  children: ReactNode;
}) {
  const [pos, setPos] = useState({ right: 24, bottom: 24 });
  const [closed, setClosed] = useState(false);
  const [open, setOpen] = useState(false);
  const dragging = useRef(false);
  const dragDist = useRef(0);

  if (closed) return null;

  // keep the panel on screen wherever the button was dragged.
  // safe at hydration: server and first client render both start at the default position
  const vw = typeof window === 'undefined' ? Infinity : window.innerWidth;
  const vh = typeof window === 'undefined' ? Infinity : window.innerHeight;
  const flipDown = pos.bottom > vh - PANEL_H;
  const flipLeft = pos.right > vw - PANEL_W;

  return (
    <div
      className="fixed z-30 touch-none w-14 h-14"
      style={{ right: pos.right, bottom: pos.bottom }}
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture(e.pointerId);
        dragging.current = true;
        dragDist.current = 0;
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        // 4px threshold: a plain click still fires the popover, only a real drag suppresses it
        dragDist.current += Math.abs(e.movementX) + Math.abs(e.movementY);
        setPos((p) => ({
          right: clamp(p.right - e.movementX, window.innerWidth - SIZE),
          bottom: clamp(p.bottom - e.movementY, window.innerHeight - SIZE),
        }));
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
    >
      {/* flip below the button when dragged near the top, so the panel stays on screen */}
      {open && (
        <div
          className={`absolute! w-64 max-w-[calc(100vw-2rem)] panel rounded-xl p-3 shadow-xl float-in [--radius:0.75rem] ${
            flipDown ? 'top-[4.5rem]' : 'bottom-[4.5rem]'
          } ${flipLeft ? 'left-0' : 'right-0'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ponytail: plain img, no layout shift to fix here */}
          <img src={image} alt="" className="w-full h-auto rounded-lg" />
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">{description}</p>
        </div>
      )}

      <button
        onClick={() => {
          if (dragDist.current < 4) setOpen((o) => !o);
        }}
        title={label}
        aria-label={label}
        aria-expanded={open}
        className="w-14 h-14 rounded-full glass border border-[var(--gold-border)] text-[var(--gold)] text-xl shadow-lg cursor-grab active:cursor-grabbing hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-center"
      >
        {children}
      </button>
      <button
        onClick={() => setClosed(true)}
        title="Close"
        aria-label="Close floating button"
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--surface-hover)] border border-[var(--surface-border)] text-[var(--muted)] text-[10px] leading-none hover:text-[var(--accent-red)] flex items-center justify-center"
      >
        ✕
      </button>
    </div>
  );
}
