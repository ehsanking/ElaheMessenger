import {
  serializeSecureAttachmentForLegacyMessage,
  type LegacyAttachmentBridgePayload,
} from '@/lib/e2ee-legacy-bridge';

export type SecureAttachmentMessageInput = {
  conversationId: string;
  storagePath: string;
  downloadUrl: string;
  wrappedFileKey: string;
  wrappedFileKeyNonce: string;
  fileNonce: string;
  originalFileName: string;
  originalMimeType: string;
  originalFileSize: number;
};

export function buildSecureAttachmentLegacyMessage(input: SecureAttachmentMessageInput) {
  const payload: LegacyAttachmentBridgePayload = {
    kind: 'phase3-secure-attachment',
    version: 'v2',
    conversationId: input.conversationId,
    storagePath: input.storagePath,
    downloadUrl: input.downloadUrl,
    wrappedFileKey: input.wrappedFileKey,
    wrappedFileKeyNonce: input.wrappedFileKeyNonce,
    fileNonce: input.fileNonce,
    originalFileName: input.originalFileName,
    originalMimeType: input.originalMimeType,
    originalFileSize: input.originalFileSize,
  };

  return {
    type: 2,
    ciphertext: serializeSecureAttachmentForLegacyMessage(payload),
    nonce: 'phase3-secure-attachment',
    fileUrl: null,
    fileName: input.originalFileName,
    fileSize: input.originalFileSize,
  };
}
