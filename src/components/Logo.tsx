export function Logo() {
  return (
    <div className="row" style={{ gap: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
      <span className="logo-mark">♠</span>
      <span
        className="serif"
        style={{ fontSize: 22, letterSpacing: '-0.01em', whiteSpace: 'nowrap', color: 'var(--ink)' }}
      >
        Scrum Poker
      </span>
    </div>
  );
}
