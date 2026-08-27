'use client';

import { useRef, useState } from 'react';

// ponytail: native <dialog> — Esc, backdrop and focus trap for free, no modal library.
export function FeedbackDialog({ icon }: { icon?: boolean } = {}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | string>('idle');

  const send = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: form.get('message'), email: form.get('email') }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setStatus('sent');
      setTimeout(() => { ref.current?.close(); setStatus('idle'); }, 1500);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to send');
    }
  };

  const inputClass = "w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none input-glow transition-all";

  return (
    <>
      <button
        onClick={() => ref.current?.showModal()}
        title="Send feedback"
        aria-label="Send feedback"
        className={icon
          ? 'p-2 glass rounded-lg text-[var(--muted)] hover:text-[var(--gold)] hover:bg-[var(--surface-hover)] transition-all'
          : 'text-[var(--muted)] text-xs underline underline-offset-4 hover:text-[var(--gold)] transition-colors'}
      >
        {icon ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 21l1.4-3.5A7.9 7.9 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ) : 'Send feedback'}
      </button>

      <dialog
        ref={ref}
        onClose={() => setStatus('idle')}
        className="panel rounded-2xl p-6 w-[min(28rem,calc(100vw-2rem))] m-auto [--surface:#fffdf5] dark:[--surface:#17231d] backdrop:bg-black/70 text-[var(--foreground)] [--radius:1rem]"
      >
        <form onSubmit={send}>
          <h2 className="text-xl font-serif font-bold gold-foil mb-1">Send Feedback</h2>
          <p className="text-[var(--muted)] text-xs mb-4">Bugs, ideas, complaints — all welcome.</p>

          <label htmlFor="fb-message" className="block text-[11px] font-semibold text-[var(--gold)] mb-1.5 uppercase tracking-[0.18em]">Message</label>
          <textarea
            id="fb-message"
            name="message"
            required
            maxLength={2000}
            rows={5}
            placeholder="What's on your mind?"
            className={`${inputClass} resize-none mb-4`}
          />

          <label htmlFor="fb-email" className="block text-[11px] font-semibold text-[var(--gold)] mb-1.5 uppercase tracking-[0.18em]">Email (optional)</label>
          <input id="fb-email" name="email" type="email" maxLength={100} placeholder="you@example.com" className={`${inputClass} mb-4`} />

          {status !== 'idle' && status !== 'sending' && (
            <p role="status" className={`text-sm text-center mb-3 ${status === 'sent' ? 'text-[var(--gold)]' : 'text-[var(--accent-red)]'}`}>
              {status === 'sent' ? 'Thanks — sent!' : status}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="flex-1 py-3 rounded-lg text-sm font-semibold border border-[var(--surface-border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'sending' || status === 'sent'}
              className="btn-shine btn-felt flex-1 py-3 font-semibold rounded-lg tracking-wide"
            >
              {status === 'sending' ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
