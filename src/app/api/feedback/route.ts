// ponytail: raw fetch to the Resend REST API — no SDK dependency for one POST.
const RECENT = new Map<string, number>();
const THROTTLE_MS = 60_000;

export async function POST(request: Request) {
  // ponytail: in-memory throttle — per-process, resets on restart, and x-forwarded-for
  // is absent without a proxy (everyone shares the 'unknown' bucket) and spoofable with
  // one. Good enough to stop casual spam; move to Redis + a real client IP if it isn't.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const last = RECENT.get(ip);
  if (last && now - last < THROTTLE_MS) {
    return Response.json({ error: 'Please wait a minute before sending again' }, { status: 429 });
  }
  for (const [key, ts] of RECENT) if (now - ts > THROTTLE_MS) RECENT.delete(key);

  const body = await request.json().catch(() => null);
  const message = String(body?.message ?? '').trim().slice(0, 2000);
  const from = String(body?.email ?? '').trim().slice(0, 100);
  if (!message) {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FEEDBACK_FROM,
      to: process.env.FEEDBACK_TO,
      subject: 'Scrum Poker Feedback',
      // ponytail: sender goes in the body, not a reply_to header — plain text, no escaping needed
      text: `From: ${from || 'anonymous'}\n\n${message}`,
    }),
  });

  if (!res.ok) {
    console.error('Resend failed', res.status, await res.text());
    return Response.json({ error: 'Could not send feedback' }, { status: 502 });
  }

  RECENT.set(ip, now);
  return Response.json({ ok: true });
}
