import { NextResponse } from 'next/server';
import { getRecoveryQuestion, recoverPassword } from '@/app/actions/auth';
import { assertSameOrigin } from '@/lib/request-security';
import { getRequestIdForRequest, respondWithInternalError, respondWithSafeError } from '@/lib/http-errors';

export async function POST(request: Request) {
  const requestId = getRequestIdForRequest(request);
  try {
    assertSameOrigin(request);

    const body = await request.json();
    const action = typeof body?.action === 'string' ? body.action : '';

    if (action === 'question') {
      const result = await getRecoveryQuestion({
        username: typeof body?.username === 'string' ? body.username : '',
      });

      if (result.error) {
        return respondWithSafeError({
          status: 400,
          message: result.error,
          code: 'REQUEST_REJECTED',
          requestId,
        });
      }

      return NextResponse.json({
        success: true,
        recoveryQuestion: 'recoveryQuestion' in result ? result.recoveryQuestion : '',
      });
    }

    if (action === 'reset') {
      const result = await recoverPassword({
        username: typeof body?.username === 'string' ? body.username : '',
        recoveryAnswer: typeof body?.recoveryAnswer === 'string' ? body.recoveryAnswer : '',
        newPassword: typeof body?.newPassword === 'string' ? body.newPassword : '',
        confirmPassword: typeof body?.confirmPassword === 'string' ? body.confirmPassword : '',
      });

      if (result.error) {
        return respondWithSafeError({
          status: 400,
          message: result.error,
          code: 'REQUEST_REJECTED',
          requestId,
        });
      }

      return NextResponse.json({ success: true });
    }

    return respondWithSafeError({
      status: 400,
      message: 'Invalid action.',
      code: 'VALIDATION_ERROR',
      action: 'Use action "question" or "reset".',
      requestId,
    });
  } catch (error) {
    return respondWithInternalError('Password recovery API', error, { requestId });
  }
}
