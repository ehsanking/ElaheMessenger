import { describe, expect, it } from 'vitest';

/**
 * Tests for the task queue module.
 *
 * Covers:
 * - SimpleQueue concurrency control
 * - Task enqueuing and execution
 * - Background job registration and processing
 * - Queue metrics tracking
 */

const taskQueueModule = await import('@/lib/task-queue');
const { enqueueTask, registerBackgroundJob, enqueueBackgroundJob, getBackgroundQueueSnapshot } = taskQueueModule;

describe('Task Queue', () => {
  describe('enqueueTask', () => {
    it('executes a simple task and returns its result', async () => {
      const result = await enqueueTask(async () => 42);
      expect(result).toBe(42);
    });

    it('handles tasks that return strings', async () => {
      const result = await enqueueTask(async () => 'hello');
      expect(result).toBe('hello');
    });

    it('propagates errors from failed tasks', async () => {
      await expect(
        enqueueTask(async () => {
          throw new Error('task failed');
        }),
      ).rejects.toThrow('task failed');
    });

    it('processes multiple tasks concurrently', async () => {
      const results: number[] = [];
      const tasks = [1, 2, 3, 4, 5].map((n) =>
        enqueueTask(async () => {
          results.push(n);
          return n * 2;
        }),
      );

      const values = await Promise.all(tasks);
      expect(values).toEqual([2, 4, 6, 8, 10]);
      expect(results).toHaveLength(5);
    });
  });

  describe('Background Jobs', () => {
    it('registers and processes a background job', async () => {
      let processed = false;
      let receivedPayload: Record<string, unknown> | null = null;

      registerBackgroundJob('test_job', async (payload) => {
        processed = true;
        receivedPayload = payload;
      });

      const result = await enqueueBackgroundJob({
        name: 'test_job',
        payload: { message: 'hello' },
      });

      expect(result.queued).toBe(true);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(processed).toBe(true);
      expect(receivedPayload).toEqual({ message: 'hello' });
    });

    it('handles unregistered job names gracefully', async () => {
      const result = await enqueueBackgroundJob({
        name: 'nonexistent_job_' + Date.now(),
        payload: {},
      });

      expect(result.queued).toBe(true);
      // Should not throw, just log a warning
    });
  });

  describe('Queue Snapshot', () => {
    it('returns a snapshot of the queue state', async () => {
      const snapshot = await getBackgroundQueueSnapshot();
      expect(snapshot).toBeDefined();
      expect(snapshot.mode).toBe('local'); // No Redis in test environment
      expect(typeof snapshot.concurrency).toBe('number');
      expect(snapshot.concurrency).toBeGreaterThan(0);
      expect(typeof snapshot.inMemoryPending).toBe('number');
      expect(typeof snapshot.inMemoryActive).toBe('number');
    });
  });
});
