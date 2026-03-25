import { NextResponse } from 'next/server';
import { E2EE_POLICY, getGroupE2EEWarning } from '@/lib/e2ee-policy';

export async function GET() {
  return NextResponse.json({
    success: true,
    policy: E2EE_POLICY,
    warnings: {
      groups: getGroupE2EEWarning(),
    },
  });
}
