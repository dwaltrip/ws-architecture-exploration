import type { AppWsClient } from '../ws/types';
import { createSendMessage } from './messages';

interface ChatWsEffects {
  postNewMessage(roomId: string, text: string): void;
}

let _client: AppWsClient | null = null;

export function initChatWsEffects(client: AppWsClient): void {
  _client = client;
}

export function resetChatWsEffectsForTests(): void {
  _client = null;
}

export const chatWsEffects: ChatWsEffects = {
  postNewMessage(roomId: string, text: string) {
    if (!_client) {
      throw new Error('Chat WS effects not initialized');
    }
    if (!text.trim()) {
      return;
    }
    _client.send(createSendMessage(text, roomId));
  },
};

export type { ChatWsEffects };
