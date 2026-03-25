const CURVE = 'P-256';

const cryptoApi = () => {
  if (!globalThis.crypto?.subtle) throw new Error('WebCrypto API is required.');
  return globalThis.crypto;
};

const bytesToBase64 = (value: ArrayBuffer | Uint8Array) => {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const base64ToBytes = (value: string) => {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(value, 'base64'));
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
};

export async function generateSigningKeyPair() {
  return cryptoApi().subtle.generateKey(
    { name: 'ECDSA', namedCurve: CURVE },
    true,
    ['sign', 'verify'],
  );
}

export async function exportSigningPublicKey(key: CryptoKey) {
  const raw = await cryptoApi().subtle.exportKey('raw', key);
  return bytesToBase64(raw);
}

export async function exportSigningPrivateKey(key: CryptoKey) {
  const jwk = await cryptoApi().subtle.exportKey('jwk', key);
  return JSON.stringify(jwk);
}

export async function importSigningPublicKey(publicKey: string) {
  return cryptoApi().subtle.importKey(
    'raw',
    base64ToBytes(publicKey),
    { name: 'ECDSA', namedCurve: CURVE },
    true,
    ['verify'],
  );
}

export async function importSigningPrivateKey(privateKey: string) {
  return cryptoApi().subtle.importKey(
    'jwk',
    JSON.parse(privateKey),
    { name: 'ECDSA', namedCurve: CURVE },
    true,
    ['sign'],
  );
}

export async function signSignedPreKey(signedPreKeyPublic: string, signingPrivateKey: CryptoKey) {
  const signature = await cryptoApi().subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingPrivateKey,
    base64ToBytes(signedPreKeyPublic),
  );
  return bytesToBase64(signature);
}

export async function verifySignedPreKey(
  signedPreKeyPublic: string,
  signature: string,
  signingPublicKey: string,
) {
  const importedSigningKey = await importSigningPublicKey(signingPublicKey);
  return cryptoApi().subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    importedSigningKey,
    base64ToBytes(signature),
    base64ToBytes(signedPreKeyPublic),
  );
}
