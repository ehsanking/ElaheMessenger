import { describe, expect, it, vi } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';
import * as redisClientModule from '@/lib/redis-client';

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

  it('fails closed for configured prefixes when redis errors', async () => {
    const previousUrl = process.env.REDIS_URL;
    const previousFailClosed = process.env.RATE_LIMIT_FAIL_CLOSED_PREFIXES;
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.RATE_LIMIT_FAIL_CLOSED_PREFIXES = 'login:,2fa:';

    const spy = vi.spyOn(redisClientModule, 'getRedisClient').mockRejectedValue(new Error('redis unavailable'));

    try {
      const result = await rateLimit(`login:test-${Date.now()}`, { max: 5, windowMs: 60_000 });
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    } finally {
      spy.mockRestore();
      if (previousUrl === undefined) delete process.env.REDIS_URL;
      else process.env.REDIS_URL = previousUrl;
      if (previousFailClosed === undefined) delete process.env.RATE_LIMIT_FAIL_CLOSED_PREFIXES;
      else process.env.RATE_LIMIT_FAIL_CLOSED_PREFIXES = previousFailClosed;
    }
  });
});
