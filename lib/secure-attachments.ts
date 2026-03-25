import crypto from 'crypto';
import path from 'path';
import { readdir } from 'fs/promises';
import { scanBufferForMalware } from '@/lib/antivirus';
import { appendAuditLog } from '@/lib/audit';
import { authorizeConversationAccess } from '@/lib/conversation-access';
import { incrementMetric } from '@/lib/observability';
import { putPrivateObject, getPrivateObject, getPrivateObjectPath } from '@/lib/object-storage';

const getSigningSecret = () => {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing ENCRYPTION_KEY or JWT_SECRET for secure upload signing.');
  }
  return secret;
};

export const buildSecureAttachmentKey = (conversationId: string, fileId: string) =>
  path.posix.join('attachments', conversationId, `${fileId}.bin`);

export const verifyAttachmentWriteAccess = async (conversationId: string, userId: string) => {
  const access = await authorizeConversationAccess(conversationId, userId);
  if (!access.allowed) return access;
  if (access.kind === 'group' && access.isMuted) {
    return { allowed: false as const, reason: 'member_muted', kind: 'group' as const };
  }
  return access;
};

export const createSecureDownloadToken = (fileId: string, expiresAt: number, userId: string, conversationId: string) => {
  const payload = `${fileId}.${expiresAt}.${userId}.${conversationId}`;
  const signature = crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('base64url');
  return `${fileId}.${expiresAt}.${userId}.${conversationId}.${signature}`;
};

export const verifySecureDownloadToken = (token: string, fileId: string, userId: string, conversationId: string) => {
  const [tokenFileId, expiresAtRaw, tokenUserId, tokenConversationId, signature] = token.split('.');
  if (!tokenFileId || !expiresAtRaw || !tokenUserId || !tokenConversationId || !signature) return false;
  if (tokenFileId !== fileId || tokenUserId !== userId || tokenConversationId !== conversationId) return false;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const payload = `${tokenFileId}.${expiresAtRaw}.${tokenUserId}.${tokenConversationId}`;
  const expected = crypto.createHmac('sha256', getSigningSecret()).update(payload).digest('base64url');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
};

export const storeSecureAttachment = async (params: {
  conversationId: string;
  userId: string;
  file: File;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}) => {
  const access = await verifyAttachmentWriteAccess(params.conversationId, params.userId);
  if (!access.allowed) {
    await appendAuditLog({ action: 'SECURE_UPLOAD_BLOCKED', actorUserId: params.userId, targetId: params.conversationId, conversationId: params.conversationId, ip: params.ip, outcome: 'blocked', details: { reason: access.reason } });
    return { ok: false as const, status: 403, error: 'Access denied for this conversation.' };
  }

  const buffer = Buffer.from(await params.file.arrayBuffer());
  const scan = await scanBufferForMalware(buffer, params.file.type);
  if (!scan.clean) {
    incrementMetric('secure_uploads_blocked', 1, { reason: scan.reason ?? 'scan_failed' });
    await appendAuditLog({ action: 'SECURE_UPLOAD_BLOCKED', actorUserId: params.userId, targetId: params.conversationId, conversationId: params.conversationId, ip: params.ip, outcome: 'blocked', details: { fileName: params.file.name, fileSize: params.file.size, reason: scan.reason, detectedMime: scan.detectedMime } });
    return { ok: false as const, status: 400, error: scan.reason ?? 'Malware scan failed.' };
  }

  const fileId = crypto.randomUUID();
  const storage = await putPrivateObject(buildSecureAttachmentKey(params.conversationId, fileId), buffer);
  const expiresAt = Date.now() + 60 * 60 * 1000;
  const token = createSecureDownloadToken(fileId, expiresAt, params.userId, params.conversationId);
  incrementMetric('secure_uploads_created', 1, { kind: access.kind });
  await appendAuditLog({ action: 'SECURE_UPLOAD_CREATED', actorUserId: params.userId, targetId: fileId, conversationId: params.conversationId, ip: params.ip, outcome: 'success', details: { fileName: params.file.name, fileSize: params.file.size, sha256: scan.sha256, detectedMime: scan.detectedMime, conversationKind: access.kind, storageUrl: storage.storageUrl, ...params.metadata } });

  return { ok: true as const, fileId, token, access, storagePath: storage.storageUrl, downloadUrl: `/api/upload-secure/${fileId}?token=${token}` };
};

export const readSecureAttachment = async (conversationId: string, fileId: string) =>
  getPrivateObject(buildSecureAttachmentKey(conversationId, fileId));

export const findSecureAttachmentPath = async (fileId: string) => {
  const attachmentsRoot = path.join(process.cwd(), process.env.OBJECT_STORAGE_ROOT || 'object_storage', process.env.OBJECT_STORAGE_PRIVATE_BUCKET || 'private', 'attachments');
  const conversationDirs = await readdir(attachmentsRoot, { withFileTypes: true }).catch(() => []);
  for (const entry of conversationDirs) {
    if (!entry.isDirectory()) continue;
    const key = buildSecureAttachmentKey(entry.name, fileId);
    const candidate = getPrivateObjectPath(key);
    try {
      await import('fs/promises').then((m) => m.access(candidate));
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
};
