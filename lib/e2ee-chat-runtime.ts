import { uploadEncryptedAttachment } from '@/lib/e2ee-bridge-client';

export async function createSecureAttachmentMessage(options: {
  file: File;
  conversationKey: CryptoKey;
  conversationId: string;
  originalMimeType: string;
}) {
  const uploadResult = await uploadEncryptedAttachment({
    file: options.file,
    conversationKey: options.conversationKey,
    conversationId: options.conversationId,
  });

  if (!uploadResult?.success) {
    return uploadResult;
  }

  const composeResponse = await fetch('/api/e2ee/compose-attachment-message', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversationId: options.conversationId,
      storagePath: uploadResult.storagePath,
      downloadUrl: uploadResult.downloadUrl,
      wrappedFileKey: uploadResult.metadata?.wrappedFileKey,
      wrappedFileKeyNonce: uploadResult.metadata?.wrappedFileKeyNonce,
      fileNonce: uploadResult.metadata?.fileNonce,
      originalFileName: uploadResult.fileName,
      originalMimeType: options.originalMimeType,
      originalFileSize: uploadResult.fileSize,
    }),
  });

  return composeResponse.json();
}
