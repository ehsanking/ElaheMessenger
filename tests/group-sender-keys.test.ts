import { beforeEach, describe, expect, it } from 'vitest';
import {
  decryptGroupMessage,
  distributeSenderKey,
  encryptGroupMessage,
  generateSenderKey,
  receiveSenderKey,
  rotateSenderKey,
  storeReceivedSenderKey,
} from '@/lib/crypto/group-sender-keys';

const identityKeyA = Buffer.alloc(32, 7).toString('base64');
const identityKeyB = Buffer.alloc(32, 9).toString('base64');

function randomGroupId() {
  return `group-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

describe('group sender keys', () => {
  beforeEach(() => {
    // isolate state between test cases by replacing localStorage in runtime if it exists
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('generates sender key material', async () => {
    const material = await generateSenderKey();
    expect(material.senderKey).toBeTruthy();
    expect(material.chainKey).toBeTruthy();
    expect(material.senderPublicKey).toBeTruthy();
    expect(material.keyGeneration).toBe(0);
  });

  it('distributes sender key and recipients can unwrap', async () => {
    const groupId = randomGroupId();
    const distribution = await distributeSenderKey(groupId, [
      { userId: 'user-a', identityKey: identityKeyA },
      { userId: 'user-b', identityKey: identityKeyB },
    ]);

    expect(distribution.wrappedKeys).toHaveLength(2);
    const wrappedForB = distribution.wrappedKeys.find((item) => item.recipientUserId === 'user-b');
    expect(wrappedForB).toBeTruthy();

    const received = await receiveSenderKey(
      wrappedForB!.wrappedKey,
      wrappedForB!.nonce,
      distribution.senderPublicKey,
      identityKeyB,
    );

    expect(received.chainKey).toBeTruthy();
    expect(received.keyGeneration).toBe(distribution.keyGeneration);
  });

  it('encrypts and decrypts group messages', async () => {
    const groupId = randomGroupId();
    const senderId = 'sender-a';
    const distribution = await distributeSenderKey(groupId, [{ userId: 'user-b', identityKey: identityKeyB }]);
    const wrappedForB = distribution.wrappedKeys[0];
    const received = await receiveSenderKey(wrappedForB.wrappedKey, wrappedForB.nonce, distribution.senderPublicKey, identityKeyB);
    storeReceivedSenderKey(groupId, senderId, received.keyGeneration, received.chainKey);

    const encrypted = await encryptGroupMessage(groupId, 'hello secure group');
    const plaintext = await decryptGroupMessage(
      groupId,
      senderId,
      encrypted.ciphertext,
      encrypted.nonce,
      encrypted.keyGeneration,
      encrypted.messageIndex,
    );

    expect(plaintext).toBe('hello secure group');
  });

  it('rotates sender keys with incremented generation', async () => {
    const groupId = randomGroupId();
    const first = await distributeSenderKey(groupId, [{ userId: 'user-a', identityKey: identityKeyA }]);
    const rotated = await rotateSenderKey(groupId, [{ userId: 'user-a', identityKey: identityKeyA }]);

    expect(rotated.keyGeneration).toBe(first.keyGeneration + 1);
  });

  it('enforces forward secrecy across generations', async () => {
    const groupId = randomGroupId();
    const senderId = 'sender-a';

    const firstDistribution = await distributeSenderKey(groupId, [{ userId: 'user-b', identityKey: identityKeyB }]);
    const firstWrapped = firstDistribution.wrappedKeys[0];
    const firstReceived = await receiveSenderKey(
      firstWrapped.wrappedKey,
      firstWrapped.nonce,
      firstDistribution.senderPublicKey,
      identityKeyB,
    );
    storeReceivedSenderKey(groupId, senderId, firstReceived.keyGeneration, firstReceived.chainKey);

    const rotatedDistribution = await rotateSenderKey(groupId, [{ userId: 'user-b', identityKey: identityKeyB }]);
    const secondWrapped = rotatedDistribution.wrappedKeys[0];
    const secondReceived = await receiveSenderKey(
      secondWrapped.wrappedKey,
      secondWrapped.nonce,
      rotatedDistribution.senderPublicKey,
      identityKeyB,
    );

    const encryptedAfterRotation = await encryptGroupMessage(groupId, 'new generation message');

    await expect(
      decryptGroupMessage(
        groupId,
        senderId,
        encryptedAfterRotation.ciphertext,
        encryptedAfterRotation.nonce,
        secondReceived.keyGeneration,
        encryptedAfterRotation.messageIndex,
      ),
    ).rejects.toThrow();
  });
});
