import { logger } from '@/lib/logger';

let redisModulePromise: Promise<any> | null = null;
let redisClientPromise: Promise<any> | null = null;

async function loadRedisModule() {
  if (!redisModulePromise) {
    redisModulePromise = import('redis');
  }
  return redisModulePromise;
}

export async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL is required for shared-state runtime.');
  }

  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      const { createClient } = await loadRedisModule();
      const client = createClient({ url: redisUrl });
      client.on('error', (error: unknown) => {
        logger.error('Redis client error', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
      await client.connect();
      return client;
    })();
  }

  return redisClientPromise;
}

export async function pingRedis() {
  const client = await getRedisClient();
  return client.ping();
}
