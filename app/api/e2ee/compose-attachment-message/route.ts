import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { buildSecureAttachmentLegacyMessage } from '@/lib/e2ee-chat-bridge';

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const conversationId = typeof body?.conversationId === 'string' ? body.conversationId.trim() : '';
    const storagePath = typeof body?.storagePath === 'string' ? body.storagePath.trim() : '';
    const downloadUrl = typeof body?.downloadUrl === 'string' ? body.downloadUrl.trim() : '';
    const wrappedFileKey = typeof body?.wrappedFileKey === 'string' ? body.wrappedFileKey.trim() : '';
    const wrappedFileKeyNonce = typeof body?.wrappedFileKeyNonce === 'string' ? body.wrappedFileKeyNonce.trim() : '';
    const fileNonce = typeof body?.fileNonce === 'string' ? body.fileNonce.trim() : '';
    const originalFileName = typeof body?.originalFileName === 'string' ? body.originalFileName.trim() : '';
    const originalMimeType = typeof body?.originalMimeType === 'string' ? body.originalMimeType.trim() : 'application/octet-stream';
    const originalFileSize = typeof body?.originalFileSize === 'number' ? body.originalFileSize : 0;

    if (
      !conversationId ||
      !storagePath ||
      !downloadUrl ||
      !wrappedFileKey ||
      !wrappedFileKeyNonce ||
      !fileNonce ||
      !originalFileName ||
      !originalFileSize
    ) {
      return NextResponse.json({ error: 'Missing secure attachment message fields.' }, { status: 400 });
    }

    const message = buildSecureAttachmentLegacyMessage({
      conversationId,
      storagePath,
      downloadUrl,
      wrappedFileKey,
      wrappedFileKeyNonce,
      fileNonce,
      originalFileName,
      originalMimeType,
      originalFileSize,
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compose secure attachment message.' },
      { status: 500 },
    );
  }
}
