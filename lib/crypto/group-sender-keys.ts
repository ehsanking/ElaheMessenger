const encoder = new TextEncoder();
const decoder = new TextDecoder();

type SenderKeyState = {
  senderKey: string;
  chainKey: string;
  senderPublicKey: string;
  senderPrivateKey: string;
  keyGeneration: number;
  chainIndex: number;
};

export type GroupMemberKeyEnvelope = {
  userId: string;
  identityKey: string;
};

export type SenderKeyDistributionPayload = {
  groupId: string;
  senderPublicKey: string;
  keyGeneration: number;
  wrappedKeys: Array<{ recipientUserId: string; wrappedKey: string; nonce: string }>;
};

export type GroupEncryptedMessage = {
  ciphertext: string;
  nonce: string;
  keyGeneration: number;
  messageIndex: number;
};

const inMemoryStore = new Map<string, string>();

function getCrypto() {
  const cryptoImpl = globalThis.crypto;
  if (!cryptoImpl?.subtle) {
    throw new Error('Web Crypto API is unavailable in this runtime.');
  }
  return cryptoImpl;
}

function toBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value: string): ArrayBuffer {
  if (typeof Buffer !== 'undefined') {
    const raw = Buffer.from(value, 'base64');
    return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function storeGet(key: string) {
  if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  return inMemoryStore.get(key) ?? null;
}

function storeSet(key: string, value: string) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
    return;
  }
  inMemoryStore.set(key, value);
}

function stateKey(groupId: string) {
  return `elahe:group-sender:${groupId}`;
}

function inboundKey(groupId: string, senderId: string, keyGeneration: number) {
  return `elahe:group-sender:inbound:${groupId}:${senderId}:${keyGeneration}`;
}

function saveState(groupId: string, state: SenderKeyState) {
  storeSet(stateKey(groupId), JSON.stringify(state));
}

function loadState(groupId: string): SenderKeyState | null {
  const raw = storeGet(stateKey(groupId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SenderKeyState;
  } catch {
    return null;
  }
}

async function randomBase64(length: number) {
  const bytes = getCrypto().getRandomValues(new Uint8Array(length));
  return toBase64(bytes.buffer);
}

async function importAesKey(base64: string, usages: KeyUsage[]) {
  return getCrypto().subtle.importKey('raw', fromBase64(base64), 'AES-GCM', false, usages);
}

async function hmacDigest(chainKeyBase64: string, label: string) {
  const hmacKey = await getCrypto().subtle.importKey('raw', fromBase64(chainKeyBase64), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await getCrypto().subtle.sign('HMAC', hmacKey, encoder.encode(label));
  return toBase64(sig.slice(0, 32));
}

async function deriveMessageKey(chainKeyBase64: string, messageIndex: number) {
  return hmacDigest(chainKeyBase64, `message:${messageIndex}`);
}

async function deriveNextChainKey(chainKeyBase64: string, messageIndex: number) {
  return hmacDigest(chainKeyBase64, `chain:${messageIndex}`);
}

export async function generateSenderKey(): Promise<SenderKeyState> {
  return {
    senderKey: await randomBase64(32),
    chainKey: await randomBase64(32),
    senderPublicKey: await randomBase64(33),
    senderPrivateKey: await randomBase64(32),
    keyGeneration: 0,
    chainIndex: 0,
  };
}

export async function distributeSenderKey(groupId: string, members: GroupMemberKeyEnvelope[]): Promise<SenderKeyDistributionPayload> {
  const existing = loadState(groupId);
  const state = existing ?? await generateSenderKey();
  saveState(groupId, state);

  const wrappedKeys = await Promise.all(members.map(async (member) => {
    const wrappingKey = await importAesKey(member.identityKey, ['encrypt']);
    const nonce = getCrypto().getRandomValues(new Uint8Array(12));
    const encrypted = await getCrypto().subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      wrappingKey,
      encoder.encode(JSON.stringify({ senderKey: state.senderKey, chainKey: state.chainKey, keyGeneration: state.keyGeneration })),
    );
    return {
      recipientUserId: member.userId,
      wrappedKey: toBase64(encrypted),
      nonce: toBase64(nonce.buffer),
    };
  }));

  return {
    groupId,
    senderPublicKey: state.senderPublicKey,
    keyGeneration: state.keyGeneration,
    wrappedKeys,
  };
}

export async function receiveSenderKey(
  wrappedKey: string,
  nonce: string,
  senderPublicKey: string,
  recipientIdentityKey: string,
): Promise<{ senderKey: string; chainKey: string; keyGeneration: number; senderPublicKey: string }> {
  const unwrapKey = await importAesKey(recipientIdentityKey, ['decrypt']);
  const decrypted = await getCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(nonce) },
    unwrapKey,
    fromBase64(wrappedKey),
  );

  const payload = JSON.parse(decoder.decode(new Uint8Array(decrypted))) as {
    senderKey: string;
    chainKey: string;
    keyGeneration: number;
  };

  return {
    senderKey: payload.senderKey,
    chainKey: payload.chainKey,
    keyGeneration: payload.keyGeneration,
    senderPublicKey,
  };
}

export async function rotateSenderKey(groupId: string, members: GroupMemberKeyEnvelope[]) {
  const previous = loadState(groupId);
  const next = await generateSenderKey();
  next.keyGeneration = (previous?.keyGeneration ?? -1) + 1;
  next.chainIndex = 0;
  saveState(groupId, next);
  return distributeSenderKey(groupId, members);
}

export async function encryptGroupMessage(groupId: string, plaintext: string): Promise<GroupEncryptedMessage> {
  const state = loadState(groupId);
  if (!state) throw new Error('Missing sender key for this group.');

  const messageKeyBase64 = await deriveMessageKey(state.chainKey, state.chainIndex);
  const messageKey = await importAesKey(messageKeyBase64, ['encrypt']);
  const nonce = getCrypto().getRandomValues(new Uint8Array(12));
  const ciphertext = await getCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    messageKey,
    encoder.encode(plaintext),
  );

  state.chainKey = await deriveNextChainKey(state.chainKey, state.chainIndex);
  const usedIndex = state.chainIndex;
  state.chainIndex += 1;
  saveState(groupId, state);

  return {
    ciphertext: toBase64(ciphertext),
    nonce: toBase64(nonce.buffer),
    keyGeneration: state.keyGeneration,
    messageIndex: usedIndex,
  };
}

export async function decryptGroupMessage(
  groupId: string,
  senderId: string,
  ciphertext: string,
  nonce: string,
  keyGeneration: number,
  messageIndex: number,
): Promise<string> {
  const incoming = storeGet(inboundKey(groupId, senderId, keyGeneration));
  if (!incoming) throw new Error('No sender key available for this message generation.');
  const state = JSON.parse(incoming) as { chainKey: string };
  const messageKeyBase64 = await deriveMessageKey(state.chainKey, messageIndex);
  const messageKey = await importAesKey(messageKeyBase64, ['decrypt']);
  const decrypted = await getCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(nonce) },
    messageKey,
    fromBase64(ciphertext),
  );
  return decoder.decode(new Uint8Array(decrypted));
}

export function storeReceivedSenderKey(
  groupId: string,
  senderId: string,
  keyGeneration: number,
  chainKey: string,
) {
  storeSet(inboundKey(groupId, senderId, keyGeneration), JSON.stringify({ chainKey }));
}
