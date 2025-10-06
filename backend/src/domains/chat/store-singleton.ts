import { createChatStore } from '../../db/chat-store';

export const chatStore = createChatStore();

export function resetChatStoreForTests() {
  chatStore.reset();
}
