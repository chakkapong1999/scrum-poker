import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/feedback/route';

const post = (body: unknown, ip: string) =>
  POST(new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  }));

describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
  });

  it('rejects an empty message', async () => {
    const res = await post({ message: '   ' }, '1.1.1.1');
    expect(res.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends a truncated message and throttles the next one', async () => {
    const res = await post({ message: 'x'.repeat(3000) }, '2.2.2.2');
    expect(res.status).toBe(200);
    const sent = JSON.parse((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(sent.text).toContain('anonymous');
    expect(sent.text.length).toBeLessThanOrEqual(2000 + 20);

    expect((await post({ message: 'again' }, '2.2.2.2')).status).toBe(429);
  });
});
