export const E2EE_UNAVAILABLE_WARNING = 'E2EE unavailable — verify keys or retry.';

export type EncryptMessageFn = (sessionKey: CryptoKey, plaintext: string) => Promise<{ ciphertext: string; nonce: string }>;

export async function prepareDirectMessagePayload(options: {
  plaintext: string;
  sessionKey: CryptoKey | null;
  encryptMessageFn: EncryptMessageFn;
}) {
  if (!options.sessionKey) {
    return {
      ok: false as const,
      warning: E2EE_UNAVAILABLE_WARNING,
    };
  }

  try {
    const encrypted = await options.encryptMessageFn(options.sessionKey, options.plaintext);
    return {
      ok: true as const,
      ciphertext: encrypted.ciphertext,
      nonce: encrypted.nonce,
    };
  } catch {
    return {
      ok: false as const,
      warning: E2EE_UNAVAILABLE_WARNING,
    };
  }
}
