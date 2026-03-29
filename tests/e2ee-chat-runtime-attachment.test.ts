import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/e2ee-bridge-client', () => ({
  uploadEncryptedAttachment: vi.fn(),
}));

import { createSecureAttachmentMessage } from '@/lib/e2ee-chat-runtime';
import { uploadEncryptedAttachment } from '@/lib/e2ee-bridge-client';
import { parseSecureAttachmentFromLegacyMessage } from '@/lib/e2ee-legacy-bridge';

describe('secure attachment runtime composition', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('composes a type 2 message with required wrapped key metadata', async () => {
    vi.mocked(uploadEncryptedAttachment).mockResolvedValue({
      success: true,
      storagePath: 'private://conv-1/file.bin',
      downloadUrl: '/api/upload-secure/file-1',
      headerDownloadUrl: '/api/upload-secure/file-1',
      downloadToken: 'download-token',
      fileName: 'doc.pdf',
      fileSize: 2048,
      metadata: {
        wrappedFileKey: 'wrapped-key',
        wrappedFileKeyNonce: 'wrapped-nonce',
        fileNonce: 'file-nonce',
      },
    });

    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({
        success: true,
        message: {
          type: 2,
          nonce: 'phase3-secure-attachment',
          ciphertext: JSON.stringify({
            kind: 'phase3-secure-attachment',
            version: 'v2',
            conversationId: 'conv-1',
            storagePath: 'private://conv-1/file.bin',
            downloadUrl: '/api/upload-secure/file-1',
            wrappedFileKey: 'wrapped-key',
            wrappedFileKeyNonce: 'wrapped-nonce',
            fileNonce: 'file-nonce',
            originalFileName: 'doc.pdf',
            originalMimeType: 'application/pdf',
            originalFileSize: 2048,
          }),
          fileName: 'doc.pdf',
          fileSize: 2048,
        },
      }),
    })));

    const result = await createSecureAttachmentMessage({
      file: new File([new Uint8Array([1, 2, 3])], 'doc.pdf', { type: 'application/pdf' }),
      conversationKey: {} as CryptoKey,
      conversationId: 'conv-1',
      originalMimeType: 'application/pdf',
    });

    expect(result.success).toBe(true);
    expect(result.message?.type).toBe(2);
    expect(result.downloadToken).toBe('download-token');

    const bridgePayload = parseSecureAttachmentFromLegacyMessage(result.message?.ciphertext ?? '');
    expect(bridgePayload?.wrappedFileKey).toBe('wrapped-key');
    expect(bridgePayload?.wrappedFileKeyNonce).toBe('wrapped-nonce');
    expect(bridgePayload?.fileNonce).toBe('file-nonce');
  });
});
