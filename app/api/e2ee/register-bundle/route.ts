import { NextResponse } from 'next/server';
import { verifySignedPreKey } from '@/lib/e2ee-signing';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const agreementPublicKey = typeof body?.agreementPublicKey === 'string' ? body.agreementPublicKey.trim() : '';
    const signingPublicKey = typeof body?.signingPublicKey === 'string' ? body.signingPublicKey.trim() : '';
    const signedPreKey = typeof body?.signedPreKey === 'string' ? body.signedPreKey.trim() : '';
    const signedPreKeySig = typeof body?.signedPreKeySig === 'string' ? body.signedPreKeySig.trim() : '';

    if (!agreementPublicKey || !signingPublicKey || !signedPreKey || !signedPreKeySig) {
      return NextResponse.json({ error: 'Missing v2 registration bundle fields.' }, { status: 400 });
    }

    const signatureValid = await verifySignedPreKey(signedPreKey, signedPreKeySig, signingPublicKey);
    if (!signatureValid) {
      return NextResponse.json({ error: 'Invalid signed pre-key signature.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      normalized: {
        identityKeyPublic: agreementPublicKey,
        signingPublicKey: signingPublicKey,
        signedPreKey,
        signedPreKeySig,
        e2eeVersion: 'v2',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to validate registration bundle.' },
      { status: 500 },
    );
  }
}
