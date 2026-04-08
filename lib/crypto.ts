/**
 * Elahe Messenger E2EE Crypto Module
 * Uses WebCrypto API for client-side end-to-end encryption.
 *
 * Key Exchange: ECDH P-256
 * Encryption: AES-256-GCM
 * Key Derivation: HKDF-SHA256
 *
 * All private keys are stored ONLY in IndexedDB on the user's device.
 * The server only ever sees public keys and encrypted ciphertext.
 */

const DB_NAME = 'elahe_e2ee';
const DB_VERSION = 1;
const KEY_STORE = 'keys';

// ── IndexedDB Key Storage ───────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeKey(key: string, value: string | CryptoKeyPair): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readwrite');
    tx.objectStore(KEY_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getKey<T = string>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readonly');
    const req = tx.objectStore(KEY_STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

// ── Helpers ─────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ── Key Generation ──────────────────────────────────────────

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('jwk', key);
  return JSON.stringify(exported);
}

export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  try {
    const keyData = base64ToArrayBuffer(base64Key);
    return await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );
  } catch {
    throw new Error('Invalid public key format');
  }
}

export async function importPrivateKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
}

// ── Key Derivation ──────────────────────────────────────────

/**
 * Derive a shared AES-256-GCM key from an ECDH key pair.
 *
 * Security fixes:
 * - Uses a random 32-byte salt per derivation instead of a static string.
 *   The salt is returned so it can be transmitted alongside the public key.
 * - The derived key is non-extractable to prevent key extraction via XSS.
 *   Cached session keys use a separate exportable derivation only for
 *   IndexedDB persistence.
 *
 * If a previously generated salt is provided (e.g. from the remote peer),
 * it will be used for the derivation to ensure both sides derive the same key.
 */
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
  existingSalt?: ArrayBuffer,
): Promise<{ key: CryptoKey; salt: ArrayBuffer }> {
  // First derive raw bits using ECDH
  const sharedBits = await window.crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256,
  );

  // Generate a random salt or use the provided one
  const salt = existingSalt ?? window.crypto.getRandomValues(new Uint8Array(32)).buffer;

  // Then use HKDF to stretch the shared secret into a proper AES key
  const rawKey = await window.crypto.subtle.importKey(
    'raw',
    sharedBits,
    'HKDF',
    false,
    ['deriveKey'],
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(salt),
      info: new TextEncoder().encode('elahe-e2ee-v2-message-encryption'),
    },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable: prevents key theft via XSS
    ['encrypt', 'decrypt'],
  );

  return { key, salt };
}

// ── Message Encryption/Decryption ───────────────────────────

export async function encryptMessage(
  key: CryptoKey,
  message: string,
): Promise<{ ciphertext: string; nonce: string }> {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(message),
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    nonce: arrayBufferToBase64(iv.buffer),
  };
}

export async function decryptMessage(
  key: CryptoKey,
  ciphertextBase64: string,
  nonceBase64: string,
): Promise<string> {
  try {
    const ciphertext = base64ToArrayBuffer(ciphertextBase64);
    const iv = new Uint8Array(base64ToArrayBuffer(nonceBase64));

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error('Failed to decrypt message. The key or payload might be invalid.');
  }
}

// ── File Encryption ─────────────────────────────────────────

export async function encryptFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer,
  );

  const exportedKey = await window.crypto.subtle.exportKey('raw', key);

  return {
    ciphertext: new Blob([ciphertext]),
    key: arrayBufferToBase64(exportedKey),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

// ── Session Key Management ──────────────────────────────────
// Store and retrieve shared secrets per-conversation

export async function getOrCreateSessionKey(
  myPrivateKeyJwk: string,
  recipientPublicKeyBase64: string,
  recipientId: string,
): Promise<CryptoKey> {
  const cacheKey = `session:${recipientId}`;
  const saltCacheKey = `session-salt:${recipientId}`;
  const cached = await getKey(cacheKey);
  const cachedSalt = await getKey(saltCacheKey);
  if (cached && cachedSalt) {
    try {
      return await window.crypto.subtle.importKey(
        'raw',
        base64ToArrayBuffer(cached),
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      );
    } catch {
      // Cache is corrupted, regenerate
    }
  }

  const myPrivateKey = await importPrivateKey(myPrivateKeyJwk);
  const recipientPublicKey = await importPublicKey(recipientPublicKeyBase64);

  // Use cached salt if available, otherwise a new random salt is generated
  const existingSalt = cachedSalt ? base64ToArrayBuffer(cachedSalt) : undefined;
  const { key: sessionKey, salt } = await deriveSharedSecret(myPrivateKey, recipientPublicKey, existingSalt);

  // For caching, we need an extractable copy of the key
  const extractableKey = await window.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(salt),
      info: new TextEncoder().encode('elahe-e2ee-v2-message-encryption'),
    },
    await window.crypto.subtle.importKey(
      'raw',
      await window.crypto.subtle.deriveBits(
        { name: 'ECDH', public: recipientPublicKey },
        myPrivateKey,
        256,
      ),
      'HKDF',
      false,
      ['deriveKey'],
    ),
    { name: 'AES-GCM', length: 256 },
    true, // extractable for cache only
    ['encrypt', 'decrypt'],
  );

  const rawKey = await window.crypto.subtle.exportKey('raw', extractableKey);
  await storeKey(cacheKey, arrayBufferToBase64(rawKey));
  await storeKey(saltCacheKey, arrayBufferToBase64(salt));

  // Return the non-extractable key for runtime use
  return sessionKey;
}

// ── Identity Key Persistence ────────────────────────────────
// Store the user's identity key pair in IndexedDB

export async function storeIdentityKeyPair(keyPair: CryptoKeyPair): Promise<void> {
  const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
  const privateKeyJwk = await exportPrivateKey(keyPair.privateKey);

  await storeKey('identity:publicKey', publicKeyBase64);
  await storeKey('identity:privateKey', privateKeyJwk);
}

export async function getIdentityPrivateKey(): Promise<string | null> {
  return await getKey('identity:privateKey');
}

export async function getIdentityPublicKey(): Promise<string | null> {
  return await getKey('identity:publicKey');
}

export async function storeSignedPreKeyPair(keyPair: CryptoKeyPair): Promise<void> {
  const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
  const privateKeyJwk = await exportPrivateKey(keyPair.privateKey);

  await storeKey('signedPreKey:publicKey', publicKeyBase64);
  await storeKey('signedPreKey:privateKey', privateKeyJwk);
}

export async function getSignedPreKeyPrivate(): Promise<string | null> {
  return await getKey('signedPreKey:privateKey');
}
