import { describe, expect, it } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('blocks requests after the max is reached', async () => {
    const key = `test-${Date.now()}`;
    const first = await rateLimit(key, { max: 2, windowMs: 1000 });
    const second = await rateLimit(key, { max: 2, windowMs: 1000 });
    const third = await rateLimit(key, { max: 2, windowMs: 1000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });
});
