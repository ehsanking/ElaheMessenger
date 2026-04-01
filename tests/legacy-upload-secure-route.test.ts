import { describe, expect, it } from 'vitest';
import handler from '@/src/routes/api/upload-secure';

function createMockResponse() {
  const result: { statusCode?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      result.statusCode = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  };

  return { res, result };
}

describe('legacy upload-secure pages route', () => {
  it('is permanently disabled to avoid bypassing secure app route controls', async () => {
    const { res, result } = createMockResponse();

    await handler({ method: 'POST' } as never, res as never);

    expect(result.statusCode).toBe(410);
    expect(result.body).toEqual({
      error: 'This legacy endpoint is disabled. Use /api/upload-secure.',
      code: 'LEGACY_ENDPOINT_DISABLED',
    });
  });
});
