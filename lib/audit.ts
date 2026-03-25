import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export type AuditEvent = {
  action: string;
  actorUserId?: string | null;
  targetId?: string | null;
  ip?: string | null;
  conversationId?: string | null;
  outcome?: 'success' | 'failure' | 'blocked';
  details?: Record<string, unknown> | null;
};

export const appendAuditLog = async (event: AuditEvent) => {
  const details = {
    ...(event.details ?? {}),
    conversationId: event.conversationId ?? null,
    outcome: event.outcome ?? 'success',
  };

  try {
    await prisma.auditLog.create({
      data: {
        adminId: event.actorUserId ?? null,
        action: event.action,
        targetId: event.targetId ?? null,
        ip: event.ip ?? null,
        details: JSON.stringify(details),
      },
    });
  } catch (error) {
    logger.error('Failed to append audit log', {
      action: event.action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
