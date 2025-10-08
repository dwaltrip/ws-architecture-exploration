import type { ChatMessageBroadcastPayload } from '../../../common/src';

type ChatStore = {
  save(message: ChatMessageBroadcastPayload): void;
  find(id: string): ChatMessageBroadcastPayload | undefined;
  update(id: string, fields: Partial<ChatMessageBroadcastPayload>): ChatMessageBroadcastPayload | undefined;
  setTyping(roomId: string, userId: string, isTyping: boolean): void;
  getTyping(roomId: string): Set<string>;
  reset(): void;
};

function createChatStore(): ChatStore {
  const messages = new Map<string, ChatMessageBroadcastPayload>();
  const typingByRoom = new Map<string, Set<string>>();

  return {
    save(message) {
      messages.set(message.id, message);
    },
    find(id) {
      return messages.get(id);
    },
    update(id, fields) {
      const existing = messages.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...fields };
      messages.set(id, updated);
      return updated;
    },
    setTyping(roomId, userId, isTyping) {
      if (!typingByRoom.has(roomId)) {
        typingByRoom.set(roomId, new Set());
      }
      const typingUsers = typingByRoom.get(roomId)!;
      if (isTyping) {
        typingUsers.add(userId);
      } else {
        typingUsers.delete(userId);
      }
    },
    getTyping(roomId) {
      return typingByRoom.get(roomId) ?? new Set();
    },
    reset() {
      messages.clear();
      typingByRoom.clear();
    },
  };
}

const chatStore = createChatStore();

export { chatStore };
