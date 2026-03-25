const onlineUsers = new Map<string, number>();

export const markUserOnline = (userId: string) => {
  const current = onlineUsers.get(userId) ?? 0;
  onlineUsers.set(userId, current + 1);
};

export const markUserOffline = (userId: string) => {
  const current = onlineUsers.get(userId) ?? 0;
  if (current <= 1) {
    onlineUsers.delete(userId);
    return;
  }
  onlineUsers.set(userId, current - 1);
};

export const getOnlineUsersCount = () => onlineUsers.size;
