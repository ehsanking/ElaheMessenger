import { NextResponse } from 'next/server';
import { logger } from './logger';
import { createRequestId, getRequestIdFromHeaders } from './observability';

type SafeErrorCode =
  | 'AUTH_REQUIRED'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'REQUEST_REJECTED'
  | 'INTERNAL_ERROR'
  | 'DEPENDENCY_FAILURE';

type SafeErrorOptions = {
  status: number;
  message: string;
  code: SafeErrorCode;
  action?: string;
  requestId?: string;
  details?: Record<string, unknown>;
  headers?: HeadersInit;
};

export const getRequestIdForRequest = (request: Request) => getRequestIdFromHeaders(request.headers);

export const respondWithSafeError = ({
  status,
  message,
  code,
  action,
  requestId,
  headers,
}: SafeErrorOptions) =>
  NextResponse.json(
    {
      error: message,
      errorCode: code,
      ...(action ? { action } : {}),
      ...(requestId ? { requestId } : {}),
    },
    {
      status,
      ...(headers ? { headers } : {}),
    },
  );

export const respondWithInternalError = (
  context: string,
  error: unknown,
  options?: {
    requestId?: string;
    action?: string;
    headers?: HeadersInit;
    details?: Record<string, unknown>;
  },
) => {
  const requestId = options?.requestId ?? createRequestId();
  logger.error(`${context} failed.`, {
    requestId,
    error: error instanceof Error ? error.message : String(error),
    ...(options?.details ?? {}),
  });
  return respondWithSafeError({
    status: 500,
    message: 'Request failed due to an internal error.',
    code: 'INTERNAL_ERROR',
    action: options?.action ?? 'Retry the request. If the issue persists, contact an administrator with the requestId.',
    requestId,
    headers: options?.headers,
  });
};

