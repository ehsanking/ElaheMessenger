import crypto from 'crypto';

const metrics = new Map<string, number>();
const gauges = new Map<string, number>();
const startedAt = Date.now();

const normalizeLabels = (labels?: Record<string, string | number | boolean | null | undefined>) => {
  if (!labels) return '';
  const entries = Object.entries(labels)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  if (entries.length === 0) return '';
  return entries.map(([key, value]) => `${key}=${String(value)}`).join(',');
};

const metricKey = (name: string, labels?: Record<string, string | number | boolean | null | undefined>) => {
  const suffix = normalizeLabels(labels);
  return suffix ? `${name}{${suffix}}` : name;
};

export const incrementMetric = (
  name: string,
  value = 1,
  labels?: Record<string, string | number | boolean | null | undefined>,
) => {
  const key = metricKey(name, labels);
  metrics.set(key, (metrics.get(key) ?? 0) + value);
};

export const setGauge = (
  name: string,
  value: number,
  labels?: Record<string, string | number | boolean | null | undefined>,
) => {
  gauges.set(metricKey(name, labels), value);
};

export const getMetricsSnapshot = () => ({
  startedAt,
  counters: Array.from(metrics.entries()).map(([name, value]) => ({ name, value })),
  gauges: Array.from(gauges.entries()).map(([name, value]) => ({ name, value })),
});

export const createRequestId = () => crypto.randomUUID();

export const getRequestIdFromHeaders = (headersLike: Headers | { get(name: string): string | null }) =>
  headersLike.get('x-request-id') || headersLike.get('x-correlation-id') || createRequestId();
