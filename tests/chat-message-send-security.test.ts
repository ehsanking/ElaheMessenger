import { describe, expect, it, vi } from 'vitest';
import { E2EE_UNAVAILABLE_WARNING, prepareDirectMessagePayload } from '@/app/chat/message-send-security';

describe('direct-message fail-closed encryption behavior', () => {
  it('blocks direct message sending when encryption fails', async () => {
    const encryptMessageFn = vi.fn(async () => {
      throw new Error('crypto failure');
    });

    const result = await prepareDirectMessagePayload({
      plaintext: 'hello',
      sessionKey: {} as CryptoKey,
      encryptMessageFn,
    });

    expect(encryptMessageFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: false,
      warning: E2EE_UNAVAILABLE_WARNING,
    });
  });

  it('blocks direct message sending when no session key exists', async () => {
    const encryptMessageFn = vi.fn();

    const result = await prepareDirectMessagePayload({
      plaintext: 'hello',
      sessionKey: null,
      encryptMessageFn,
    });

    expect(encryptMessageFn).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      warning: E2EE_UNAVAILABLE_WARNING,
    });
  });
});
