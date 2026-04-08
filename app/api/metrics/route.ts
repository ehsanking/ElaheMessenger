import { NextResponse } from 'next/server';
import { getPrometheusMetrics } from '@/lib/observability';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Prometheus-compatible metrics endpoint.
 *
 * Returns metrics in Prometheus text exposition format, suitable for
 * scraping by Prometheus, Grafana Agent, Victoria Metrics, or any
 * compatible monitoring system.
 *
 * Access control: In production, this endpoint should be protected by
 * a reverse proxy or internal-only network rule. The METRICS_SECRET
 * env var can be set to require a Bearer token.
 */
export async function GET(request: Request) {
  // Optional bearer-token protection for the metrics endpoint.
  const secret = process.env.METRICS_SECRET;
  if (secret) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (token !== secret) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  const body = getPrometheusMetrics();
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
