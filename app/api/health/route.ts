import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pingRedis } from '@/lib/redis-client';
import { getBackgroundQueueSnapshot } from '@/lib/task-queue';
import { getMetricsSnapshot } from '@/lib/observability';
import { getObjectStorageMode } from '@/lib/object-storage';
import { getShardingStrategy } from '@/lib/sharding';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const now = new Date();
  let databaseHealthy = false;
  let redisHealthy = !process.env.REDIS_URL;

  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseHealthy = true;
  } catch {
    databaseHealthy = false;
  }

  if (process.env.REDIS_URL) {
    try {
      await pingRedis();
      redisHealthy = true;
    } catch {
      redisHealthy = false;
    }
  }

  const queue = await getBackgroundQueueSnapshot();
  const metrics = getMetricsSnapshot();
  const status = databaseHealthy && redisHealthy ? 'ok' : databaseHealthy ? 'degraded' : 'down';

  return NextResponse.json(
    {
      status,
      timestamp: now.toISOString(),
      uptime: Math.round(process.uptime()),
      database: databaseHealthy ? 'up' : 'down',
      redis: redisHealthy ? 'up' : process.env.REDIS_URL ? 'down' : 'not_configured',
      queue,
      storage: { mode: getObjectStorageMode() },
      sharding: getShardingStrategy(),
      observability: {
        counters: metrics.counters.slice(-20),
        gauges: metrics.gauges,
        startedAt: new Date(metrics.startedAt).toISOString(),
      },
    },
    {
      status: status === 'ok' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
