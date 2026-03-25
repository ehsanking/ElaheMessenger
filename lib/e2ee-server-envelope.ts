import { buildLiveDecryptPayload, type SocketMessageEnvelope } from '@/lib/e2ee-live-payload';

type SenderKeyRecord = {
  identityKeyPublic?: string | null;
  signedPreKey?: string | null;
  signedPreKeySig?: string | null;
  signingPublicKey?: string | null;
  e2eeVersion?: string | null;
};

type BaseMessage = Omit<SocketMessageEnvelope, 'e2ee'>;

export function attachSenderE2EEPayload(message: BaseMessage, senderKeys: SenderKeyRecord): SocketMessageEnvelope {
  return {
    ...message,
    e2ee: buildLiveDecryptPayload({
      senderAgreementPublicKey: senderKeys.identityKeyPublic ?? null,
      senderSigningPublicKey: senderKeys.signingPublicKey ?? null,
      senderSignedPreKey: senderKeys.signedPreKey ?? null,
      senderSignedPreKeySig: senderKeys.signedPreKeySig ?? null,
      e2eeVersion: senderKeys.e2eeVersion ?? 'legacy',
    }),
  };
}

export function requiresPhase3Schema(senderKeys: SenderKeyRecord) {
  return !senderKeys.signingPublicKey || !senderKeys.e2eeVersion;
}
