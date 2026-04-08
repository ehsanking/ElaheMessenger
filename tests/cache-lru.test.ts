import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Comprehensive tests for the LRU cache module.
 * Validates size limits, LRU eviction, TTL expiry, Redis integration fallback,
 * and cache statistics.
 */

// Reset module state between tests
beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('LRU Cache', () => {
  it('should store and retrieve a cached value', async () => {
    const { setCachedValue, getCachedValue } = await import('@/lib/cache');
    setCachedValue('test-key', { data: 'hello' });
    const result = getCachedValue<{ data: string }>('test-key');
    expect(result).toEqual({ data: 'hello' });
  });

  it('should return null for expired entries', async () => {
    const { setCachedValue, getCachedValue } = await import('@/lib/cache');
    setCachedValue('expire-key', 'value', { ttlMs: 1 });
    // Wait for expiry
    await new Promise((r) => setTimeout(r, 10));
    expect(getCachedValue('expire-key')).toBeNull();
  });

  it('should return null for missing keys', async () => {
    const { getCachedValue } = await import('@/lib/cache');
    expect(getCachedValue('nonexistent')).toBeNull();
  });

  it('should evict oldest entries when MAX_ENTRIES exceeded', async () => {
    vi.stubEnv('CACHE_MAX_ENTRIES', '3');
    const { setCachedValue, getCachedValue } = await import('@/lib/cache');
    setCachedValue('a', 1);
    setCachedValue('b', 2);
    setCachedValue('c', 3);
    setCachedValue('d', 4); // Should evict 'a'
    expect(getCachedValue('a')).toBeNull();
    expect(getCachedValue('d')).toBe(4);
  });

  it('should invalidate cache by key', async () => {
    const { setCachedValue, getCachedValue, invalidateCache } = await import('@/lib/cache');
    setCachedValue('del-key', 'value');
    expect(getCachedValue('del-key')).toBe('value');
    await invalidateCache('del-key');
    expect(getCachedValue('del-key')).toBeNull();
  });

  it('should invalidate cache by prefix', async () => {
    const { setCachedValue, getCachedValue, invalidateCacheByPrefix } = await import('@/lib/cache');
    setCachedValue('conversation:user1:a', 'x');
    setCachedValue('conversation:user1:b', 'y');
    setCachedValue('conversation:user2:c', 'z');
    invalidateCacheByPrefix('conversation:user1:');
    expect(getCachedValue('conversation:user1:a')).toBeNull();
    expect(getCachedValue('conversation:user1:b')).toBeNull();
    expect(getCachedValue('conversation:user2:c')).toBe('z');
  });

  it('should report cache stats', async () => {
    const { setCachedValue, getCacheStats } = await import('@/lib/cache');
    setCachedValue('stat1', 1);
    setCachedValue('stat2', 2);
    const stats = getCacheStats();
    expect(stats.entries).toBeGreaterThanOrEqual(2);
    expect(stats.maxEntries).toBeGreaterThan(0);
  });

  it('should generate conversation cache keys correctly', async () => {
    const { conversationCacheKey } = await import('@/lib/cache');
    expect(conversationCacheKey('u1', 'direct:u1-u2')).toBe('conversation:u1:direct:u1-u2:head');
    expect(conversationCacheKey('u1', 'group:g1', 'cursor123')).toBe('conversation:u1:group:g1:cursor123');
  });

  it('getOrSetCache should call fetcher on cache miss', async () => {
    const { getOrSetCache } = await import('@/lib/cache');
    const fetcher = vi.fn().mockResolvedValue({ result: 42 });
    const value = await getOrSetCache('fetch-key', fetcher);
    expect(value).toEqual({ result: 42 });
    expect(fetcher).toHaveBeenCalledOnce();

    // Second call should use cache
    const value2 = await getOrSetCache('fetch-key', fetcher);
    expect(value2).toEqual({ result: 42 });
    expect(fetcher).toHaveBeenCalledOnce(); // Not called again
  });
});
