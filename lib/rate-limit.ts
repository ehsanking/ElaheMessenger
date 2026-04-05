type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs?: number;
  max?: number;
};

import { logger } from '@/lib/logger';
import { getRedisClient } from '@/lib/redis-client';
import { incrementMetric } from '@/lib/observability';

const store = new Map<string, RateLimitEntry>();

const getDefaultWindowMs = () => {
  const value = Number(process.env.RATE_LIMIT_WINDOW_MS);
  return Number.isFinite(value) && value > 0 ? value : 15 * 60 * 1000;
};

const getDefaultMax = () => {
  const value = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
  return Number.isFinite(value) && value > 0 ? value : 100;
};

const getFailClosedPrefixes = () =>
  (process.env.RATE_LIMIT_FAIL_CLOSED_PREFIXES ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const shouldFailClosedOnRedisError = (key: string) => {
  const prefixes = getFailClosedPrefixes();
  return prefixes.some((prefix) => key.startsWith(prefix));
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Perform a rate limit check for the given key. If a Redis URL is configured via
 * `process.env.REDIS_URL`, the rate limit state is stored in Redis for
 * cross‑instance consistency. Otherwise a fallback in‑memory map is used. The
 * check is performed as an atomic increment in Redis with an expiration set on
 * first use. If Redis is unavailable, the fallback is used and an error is
 * logged.
 */
export async function rateLimit(key: string, options: RateLimitOptions = {}): Promise<RateLimitResult> {
  const windowMs = options.windowMs ?? getDefaultWindowMs();
  const max = options.max ?? getDefaultMax();
  const now = Date.now();
  const scopedKey = `rl:${key}`;

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const client = await getRedisClient();
      // Atomically increment the request count for this key.
      const count: number = await client.incr(scopedKey);
      // Fetch the current TTL (in milliseconds). Returns -2 if the key does not exist and -1 if no expiry set.
      let pttl: number = await client.pttl(scopedKey);
      // If there is no TTL on the key or the key didn't exist before, set the TTL.
      if (pttl === -1 || pttl === -2) {
        await client.pexpire(scopedKey, windowMs);
        pttl = windowMs;
      }
      // Determine remaining attempts and when the window resets.
      const remaining = Math.max(max - count, 0);
      const resetAt = now + (typeof pttl === 'number' ? pttl : windowMs);
      if (count > max) {
        incrementMetric('rate_limit_blocked', 1, { store: 'redis' });
        return { allowed: false, remaining: 0, resetAt };
      }
      incrementMetric('rate_limit_allowed', 1, { store: 'redis' });
      return { allowed: true, remaining, resetAt };
    } catch (error) {
      logger.error('Rate limiting with Redis failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      if (shouldFailClosedOnRedisError(key)) {
        incrementMetric('rate_limit_blocked', 1, { store: 'redis_error', mode: 'fail_closed' });
        return { allowed: false, remaining: 0, resetAt: now + windowMs };
      }
      // Continue to fallback
    }
  }

  // Fallback to in-memory implementation when Redis is not configured or on error.
  const entry = store.get(scopedKey);
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(scopedKey, { count: 1, resetAt });
    incrementMetric('rate_limit_allowed', 1, { store: 'memory' });
    return { allowed: true, remaining: Math.max(max - 1, 0), resetAt };
  }
  if (entry.count >= max) {
    incrementMetric('rate_limit_blocked', 1, { store: 'memory' });
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  store.set(scopedKey, entry);
  incrementMetric('rate_limit_allowed', 1, { store: 'memory' });
  return { allowed: true, remaining: Math.max(max - entry.count, 0), resetAt: entry.resetAt };
}

export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Limit': String(getDefaultMax()),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}
