export type LegacyAttachmentBridgePayload = {
  kind: 'phase3-secure-attachment';
  version: 'v2';
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

export function serializeSecureAttachmentForLegacyMessage(payload: LegacyAttachmentBridgePayload) {
  return JSON.stringify(payload);
}

export function parseSecureAttachmentFromLegacyMessage(ciphertext: string) {
  try {
    const parsed = JSON.parse(ciphertext) as Partial<LegacyAttachmentBridgePayload>;
    if (
      parsed.kind !== 'phase3-secure-attachment' ||
      parsed.version !== 'v2' ||
      !parsed.conversationId ||
      !parsed.storagePath ||
      !parsed.downloadUrl ||
      !parsed.wrappedFileKey ||
      !parsed.wrappedFileKeyNonce ||
      !parsed.fileNonce ||
      !parsed.originalFileName ||
      typeof parsed.originalFileSize !== 'number'
    ) {
      return null;
    }

    return parsed as LegacyAttachmentBridgePayload;
  } catch {
    return null;
  }
}

export function isSecureAttachmentBridgePayload(ciphertext: string) {
  return parseSecureAttachmentFromLegacyMessage(ciphertext) !== null;
}
