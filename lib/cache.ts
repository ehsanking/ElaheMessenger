type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type CacheOptions = {
  ttlMs?: number;
};

const store = new Map<string, CacheEntry<unknown>>();

const getDefaultTtl = () => {
  const ttl = Number(process.env.CACHE_TTL_MS);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 30_000;
};

export const getCachedValue = <T>(key: string): T | null => {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
};

export const setCachedValue = <T>(key: string, value: T, options: CacheOptions = {}) => {
  const ttlMs = options.ttlMs ?? getDefaultTtl();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
};

export const getOrSetCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> => {
  const cached = getCachedValue<T>(key);
  if (cached !== null) return cached;
  const value = await fetcher();
  setCachedValue(key, value, options);
  return value;
};

export const invalidateCache = (key: string) => {
  store.delete(key);
};


export const invalidateCacheByPrefix = (prefix: string) => {
  for (const key of Array.from(store.keys())) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};

export const conversationCacheKey = (userId: string, conversationKey: string, cursor = "head") =>
  `conversation:${userId}:${conversationKey}:${cursor}`;
