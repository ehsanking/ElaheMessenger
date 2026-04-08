"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  decryptGroupMessage,
  distributeSenderKey,
  encryptGroupMessage,
  receiveSenderKey,
  rotateSenderKey,
  storeReceivedSenderKey,
  type GroupMemberKeyEnvelope,
} from '@/lib/crypto/group-sender-keys';

type GroupConversationMeta = {
  id: string;
  encrypted: boolean;
};

type MessageComposerProps = {
  socket: Socket | null;
  conversation?: GroupConversationMeta | null;
  identityWrappingKey?: string;
  groupMembers?: GroupMemberKeyEnvelope[];
  onSend: (payload: { ciphertext: string; nonce: string; keyGeneration?: number; messageIndex?: number }) => Promise<void> | void;
  onDecryptPreview?: (payload: { senderId: string; text: string }) => void;
};

export default function MessageComposer({
  socket,
  conversation,
  identityWrappingKey,
  groupMembers = [],
  onSend,
  onDecryptPreview,
}: MessageComposerProps) {
  const [input, setInput] = useState('');

  const processSenderKeyDistribution = useCallback(async (payload: {
    groupId?: string;
    senderUserId?: string;
    senderPublicKey?: string;
    wrappedKey?: string;
    nonce?: string;
    keyGeneration?: number;
  }) => {
    if (!conversation?.id || !identityWrappingKey || !payload?.wrappedKey || !payload?.nonce || !payload?.senderUserId || !payload?.senderPublicKey) {
      return;
    }
    if (payload.groupId !== conversation.id) return;

    const received = await receiveSenderKey(payload.wrappedKey, payload.nonce, payload.senderPublicKey, identityWrappingKey);
    storeReceivedSenderKey(conversation.id, payload.senderUserId, payload.keyGeneration ?? received.keyGeneration, received.chainKey);
  }, [conversation?.id, identityWrappingKey]);

  useEffect(() => {
    if (!socket) return;

    const onDistributed = (payload: {
      groupId?: string;
      senderUserId?: string;
      senderPublicKey?: string;
      wrappedKey?: string;
      nonce?: string;
      keyGeneration?: number;
    }) => {
      void processSenderKeyDistribution(payload);
    };

    const onRotated = (payload: { groupId?: string }) => {
      const rotatedGroupId = payload.groupId?.trim();
      if (rotatedGroupId && rotatedGroupId === conversation?.id && groupMembers.length > 0) {
        void rotateSenderKey(rotatedGroupId, groupMembers);
      }
    };

    socket.on('senderKeyDistributed', onDistributed);
    socket.on('groupKeyRotated', onRotated);

    return () => {
      socket.off('senderKeyDistributed', onDistributed);
      socket.off('groupKeyRotated', onRotated);
    };
  }, [conversation?.id, groupMembers, processSenderKeyDistribution, socket]);

  const submit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    if (conversation?.encrypted) {
      if (groupMembers.length > 0) {
        const distribution = await distributeSenderKey(conversation.id, groupMembers);
        socket?.emit('senderKeyDistributed', { groupId: conversation.id, wrappedKeys: distribution.wrappedKeys, keyGeneration: distribution.keyGeneration });
      }

      const encrypted = await encryptGroupMessage(conversation.id, text);
      await onSend({
        ciphertext: encrypted.ciphertext,
        nonce: encrypted.nonce,
        keyGeneration: encrypted.keyGeneration,
        messageIndex: encrypted.messageIndex,
      });
      setInput('');
      return;
    }

    await onSend({ ciphertext: text, nonce: '' });
    setInput('');
  }, [conversation?.encrypted, conversation?.id, groupMembers, input, onSend, socket]);

  // Optional helper for consumer tests / previews.
  const tryDecryptPreview = useCallback(async (payload: {
    groupId: string;
    senderId: string;
    ciphertext: string;
    nonce: string;
    keyGeneration: number;
    messageIndex: number;
  }) => {
    if (!onDecryptPreview) return;
    const text = await decryptGroupMessage(
      payload.groupId,
      payload.senderId,
      payload.ciphertext,
      payload.nonce,
      payload.keyGeneration,
      payload.messageIndex,
    );
    onDecryptPreview({ senderId: payload.senderId, text });
  }, [onDecryptPreview]);

  useEffect(() => {
    if (!socket || !conversation?.encrypted) return;
    const handler = (payload: {
      groupId?: string;
      senderId?: string;
      ciphertext?: string;
      nonce?: string;
      keyGeneration?: number;
      messageIndex?: number;
    }) => {
      if (!payload.groupId || payload.groupId !== conversation.id || !payload.senderId || !payload.ciphertext || !payload.nonce) return;
      if (!Number.isInteger(payload.keyGeneration) || !Number.isInteger(payload.messageIndex)) return;
      void tryDecryptPreview({
        groupId: payload.groupId,
        senderId: payload.senderId,
        ciphertext: payload.ciphertext,
        nonce: payload.nonce,
        keyGeneration: Number(payload.keyGeneration),
        messageIndex: Number(payload.messageIndex),
      });
    };

    socket.on('receiveMessage', handler);
    return () => {
      socket.off('receiveMessage', handler);
    };
  }, [conversation?.encrypted, conversation?.id, socket, tryDecryptPreview]);

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={conversation?.encrypted ? 'Write an encrypted group message…' : 'Write a message…'}
        className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
      />
      <button type="submit" className="rounded-xl bg-brand-gold px-4 py-2 text-sm font-medium text-zinc-950">
        Send
      </button>
    </form>
  );
}
