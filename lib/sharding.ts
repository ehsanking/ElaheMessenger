const shardCount = Math.max(1, Number(process.env.SHARD_COUNT || 1));

export const getShardForKey = (key: string) => {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return hash % shardCount;
};

export const getConversationShard = (recipientId?: string | null, groupId?: string | null) =>
  getShardForKey(groupId ? `group:${groupId}` : `direct:${recipientId || 'unknown'}`);

export const getShardingStrategy = () => ({
  enabled: shardCount > 1,
  shardCount,
  mode: shardCount > 1 ? 'hash_by_conversation' : 'single_primary',
});
