import { describe, expect, it } from 'vitest';
import { buildSecureAttachmentLegacyMessage } from '@/lib/e2ee-chat-bridge';
import { parseSecureAttachmentFromLegacyMessage } from '@/lib/e2ee-legacy-bridge';

describe('phase 3 chat bridge for secure attachments', () => {
  it('builds a legacy-compatible secure attachment message envelope', () => {
    const message = buildSecureAttachmentLegacyMessage({
      conversationId: 'conv-1',
      storagePath: 'private://conv-1/file.bin',
      downloadUrl: '/api/upload-secure/file-1?token=abc',
      wrappedFileKey: 'wrapped-key',
      wrappedFileKeyNonce: 'wrapped-nonce',
      fileNonce: 'file-nonce',
      originalFileName: 'report.pdf',
      originalMimeType: 'application/pdf',
      originalFileSize: 2048,
    });

    expect(message.type).toBe(2);
    expect(message.nonce).toBe('phase3-secure-attachment');
    expect(message.fileUrl).toBeNull();
    expect(message.fileName).toBe('report.pdf');

    const parsed = parseSecureAttachmentFromLegacyMessage(message.ciphertext);
    expect(parsed?.downloadUrl).toContain('/api/upload-secure/file-1');
    expect(parsed?.wrappedFileKey).toBe('wrapped-key');
    expect(parsed?.originalMimeType).toBe('application/pdf');
  });
});
