import type { AppWsClient } from '../ws/types';
import { createSendMessage, createTypingMessage } from './messages';

interface ChatWsEffects {
  postNewMessage(roomId: string, text: string): void;
  updateTypingStatus(roomId: string, isTyping: boolean): void;
}

let _client: AppWsClient | null = null;
function requireClient(): AppWsClient {
  if (!_client) {
    throw new Error('Chat WS effects not initialized');
  }
  return _client;
} 

export function initChatWsEffects(client: AppWsClient): void {
  _client = client;
}

export function resetChatWsEffectsForTests(): void {
  _client = null;
}

export const chatWsEffects: ChatWsEffects = {
  postNewMessage(roomId: string, text: string) {
    const client = requireClient();
    if (!text.trim()) {
      return;
    }
    client.send(createSendMessage(text, roomId));
  },

  updateTypingStatus(roomId: string, isTyping: boolean) {
    requireClient().send(createTypingMessage(roomId, isTyping));
  },

};

export type { ChatWsEffects };
