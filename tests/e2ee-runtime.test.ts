import { describe, expect, it } from 'vitest';
import { attachSenderE2EEPayload, requiresPhase3Schema } from '@/lib/e2ee-server-envelope';
import { buildLiveDecryptPayload } from '@/lib/e2ee-live-payload';

describe('phase 3 runtime payload helpers', () => {
  it('builds a normalized live decrypt payload', () => {
    const payload = buildLiveDecryptPayload({
      senderAgreementPublicKey: 'agreement-key',
      senderSigningPublicKey: 'signing-key',
      senderSignedPreKey: 'signed-prekey',
      senderSignedPreKeySig: 'signature',
      e2eeVersion: 'v2',
    });

    expect(payload.senderAgreementPublicKey).toBe('agreement-key');
    expect(payload.senderSigningPublicKey).toBe('signing-key');
    expect(payload.e2eeVersion).toBe('v2');
  });

  it('attaches sender E2EE metadata to a socket message envelope', () => {
    const envelope = attachSenderE2EEPayload(
      {
        id: 'message-1',
        senderId: 'user-1',
        recipientId: 'user-2',
        type: 0,
        ciphertext: 'ciphertext',
        nonce: 'nonce',
        createdAt: new Date().toISOString(),
      },
      {
        identityKeyPublic: 'agreement-key',
        signingPublicKey: 'signing-key',
        signedPreKey: 'signed-prekey',
        signedPreKeySig: 'signature',
        e2eeVersion: 'v2',
      },
    );

    expect(envelope.e2ee?.senderAgreementPublicKey).toBe('agreement-key');
    expect(envelope.e2ee?.senderSigningPublicKey).toBe('signing-key');
    expect(envelope.e2ee?.e2eeVersion).toBe('v2');
  });

  it('detects when schema migration is still required', () => {
    expect(requiresPhase3Schema({ identityKeyPublic: 'agreement-only' })).toBe(true);
    expect(
      requiresPhase3Schema({
        identityKeyPublic: 'agreement-key',
        signingPublicKey: 'signing-key',
        e2eeVersion: 'v2',
      }),
    ).toBe(false);
  });
});
