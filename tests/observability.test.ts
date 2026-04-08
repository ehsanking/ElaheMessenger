import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Tests for the observability module.
 * Validates metrics, gauges, histograms, Prometheus export, and timer utility.
 */

beforeEach(() => {
  vi.resetModules();
});

describe('Observability', () => {
  it('should increment counters', async () => {
    const { incrementMetric, getMetricsSnapshot } = await import('@/lib/observability');
    incrementMetric('test_counter', 1);
    incrementMetric('test_counter', 2);
    const snapshot = getMetricsSnapshot();
    const counter = snapshot.counters.find((c) => c.name === 'test_counter');
    expect(counter).toBeDefined();
    expect(counter!.value).toBe(3);
  });

  it('should set gauges', async () => {
    const { setGauge, getMetricsSnapshot } = await import('@/lib/observability');
    setGauge('active_connections', 42);
    const snapshot = getMetricsSnapshot();
    const gauge = snapshot.gauges.find((g) => g.name === 'active_connections');
    expect(gauge).toBeDefined();
    expect(gauge!.value).toBe(42);
  });

  it('should record histogram observations with percentiles', async () => {
    const { observeHistogram, getMetricsSnapshot } = await import('@/lib/observability');
    for (let i = 1; i <= 100; i++) {
      observeHistogram('request_latency', i);
    }
    const snapshot = getMetricsSnapshot();
    const hist = snapshot.histograms.find((h) => h.name === 'request_latency');
    expect(hist).toBeDefined();
    expect(hist!.count).toBe(100);
    expect(hist!.sum).toBe(5050);
    expect(hist!.avg).toBeCloseTo(50.5);
    expect(hist!.p50).toBeGreaterThanOrEqual(49);
    expect(hist!.p95).toBeGreaterThanOrEqual(94);
  });

  it('should support metric labels', async () => {
    const { incrementMetric, getMetricsSnapshot } = await import('@/lib/observability');
    incrementMetric('http_requests', 1, { method: 'GET', status: 200 });
    incrementMetric('http_requests', 1, { method: 'POST', status: 201 });
    const snapshot = getMetricsSnapshot();
    const gets = snapshot.counters.find((c) => c.name.includes('method=GET'));
    expect(gets).toBeDefined();
  });

  it('should export Prometheus-compatible text', async () => {
    const { incrementMetric, getPrometheusMetrics } = await import('@/lib/observability');
    incrementMetric('prom_test_metric', 5);
    const text = getPrometheusMetrics();
    expect(text).toContain('process_uptime_seconds');
    expect(text).toContain('elahe_prom_test_metric 5');
  });

  it('should track uptime', async () => {
    const { getMetricsSnapshot } = await import('@/lib/observability');
    const snapshot = getMetricsSnapshot();
    expect(snapshot.uptimeMs).toBeGreaterThanOrEqual(0);
    expect(snapshot.startedAt).toBeGreaterThan(0);
    expect(snapshot.lastUpdatedAt).toBeGreaterThan(0);
  });

  it('should create request IDs', async () => {
    const { createRequestId } = await import('@/lib/observability');
    const id1 = createRequestId();
    const id2 = createRequestId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('should create and measure timers', async () => {
    const { createTimer, getMetricsSnapshot } = await import('@/lib/observability');
    const timer = createTimer('test_timer');
    await new Promise((r) => setTimeout(r, 10));
    const duration = timer.end();
    expect(duration).toBeGreaterThanOrEqual(5); // Allow some margin
    const snapshot = getMetricsSnapshot();
    const hist = snapshot.histograms.find((h) => h.name === 'test_timer');
    expect(hist).toBeDefined();
    expect(hist!.count).toBe(1);
  });

  it('should enforce label cardinality limits', async () => {
    const { incrementMetric, getMetricsSnapshot } = await import('@/lib/observability');
    // Create many label variants — should not exceed MAX_LABEL_CARDINALITY
    for (let i = 0; i < 120; i++) {
      incrementMetric('cardinality_test', 1, { variant: `v${i}` });
    }
    const snapshot = getMetricsSnapshot();
    const matching = snapshot.counters.filter((c) => c.name.includes('cardinality_test'));
    // Should be capped (some evicted)
    expect(matching.length).toBeLessThanOrEqual(110);
  });
});
