import { describe, expect, it } from 'vitest';
import {
  generateSigningKeyPair,
  exportSigningPublicKey,
  signSignedPreKey,
  verifySignedPreKey,
} from '@/lib/e2ee-signing';
import { generateAgreementKeyPair, exportAgreementPublicKey } from '@/lib/e2ee-conversation';

describe('phase 3 signed prekey verification', () => {
  it('signs and verifies a signed prekey with a real signing key', async () => {
    const signingKeyPair = await generateSigningKeyPair();
    const signedPreKeyPair = await generateAgreementKeyPair();

    const signingPublicKey = await exportSigningPublicKey(signingKeyPair.publicKey);
    const signedPreKey = await exportAgreementPublicKey(signedPreKeyPair.publicKey);
    const signature = await signSignedPreKey(signedPreKey, signingKeyPair.privateKey);

    const valid = await verifySignedPreKey(signedPreKey, signature, signingPublicKey);
    expect(valid).toBe(true);
  });

  it('rejects a tampered signed prekey signature', async () => {
    const signingKeyPair = await generateSigningKeyPair();
    const signedPreKeyPair = await generateAgreementKeyPair();

    const signingPublicKey = await exportSigningPublicKey(signingKeyPair.publicKey);
    const signedPreKey = await exportAgreementPublicKey(signedPreKeyPair.publicKey);
    const signature = await signSignedPreKey(signedPreKey, signingKeyPair.privateKey);

    const tamperedSignedPreKey = `${signedPreKey.slice(0, -4)}ABCD`;
    const valid = await verifySignedPreKey(tamperedSignedPreKey, signature, signingPublicKey);
    expect(valid).toBe(false);
  });
});
