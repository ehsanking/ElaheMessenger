import { describe, expect, it } from 'vitest';
import { parseSendMessageDto } from '@/lib/dto/messaging';

describe('parseSendMessageDto', () => {
  it('accepts a valid direct-message payload and derives idempotencyKey from tempId', () => {
    const dto = parseSendMessageDto({
      recipientId: 'u2',
      ciphertext: 'abc',
      nonce: 'nonce',
      tempId: 'tmp-1',
    });

    expect(dto).not.toBeNull();
    expect(dto?.idempotencyKey).toBe('tmp-1');
  });

  it('rejects a payload without recipientId/groupId or ciphertext', () => {
    expect(parseSendMessageDto({ recipientId: 'u2' })).toBeNull();
    expect(parseSendMessageDto({ ciphertext: 'abc' })).toBeNull();
  });
});
