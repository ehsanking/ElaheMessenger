import { describe, expect, it } from 'vitest';
import {
  serializeSecureAttachmentForLegacyMessage,
  parseSecureAttachmentFromLegacyMessage,
  isSecureAttachmentBridgePayload,
} from '@/lib/e2ee-legacy-bridge';

describe('phase 3 legacy attachment bridge', () => {
  it('serializes and parses secure attachment bridge payloads', () => {
    const serialized = serializeSecureAttachmentForLegacyMessage({
      kind: 'phase3-secure-attachment',
      version: 'v2',
      conversationId: 'conv-1',
      storagePath: 'private://conv-1/file.bin',
      downloadUrl: '/api/upload-secure/file-1?token=abc',
      wrappedFileKey: 'wrapped-key',
      wrappedFileKeyNonce: 'wrapped-nonce',
      fileNonce: 'file-nonce',
      originalFileName: 'photo.jpg',
      originalMimeType: 'image/jpeg',
      originalFileSize: 12345,
    });

    const parsed = parseSecureAttachmentFromLegacyMessage(serialized);
    expect(parsed?.conversationId).toBe('conv-1');
    expect(parsed?.wrappedFileKey).toBe('wrapped-key');
    expect(parsed?.originalFileName).toBe('photo.jpg');
  });

  it('recognizes valid bridge payloads and rejects invalid content', () => {
    const valid = JSON.stringify({
      kind: 'phase3-secure-attachment',
      version: 'v2',
      conversationId: 'conv-1',
      storagePath: 'private://conv-1/file.bin',
      downloadUrl: '/api/upload-secure/file-1?token=abc',
      wrappedFileKey: 'wrapped-key',
      wrappedFileKeyNonce: 'wrapped-nonce',
      fileNonce: 'file-nonce',
      originalFileName: 'photo.jpg',
      originalMimeType: 'image/jpeg',
      originalFileSize: 12345,
    });

    expect(isSecureAttachmentBridgePayload(valid)).toBe(true);
    expect(isSecureAttachmentBridgePayload('{"foo":"bar"}')).toBe(false);
  });
});
