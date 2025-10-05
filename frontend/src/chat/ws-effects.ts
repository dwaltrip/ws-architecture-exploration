import { createSendMessage, createTypingMessage } from './messages';
import { createWsRef } from '../ws/create-ws-ref';

interface ChatWsEffects {
  postNewMessage(roomId: string, text: string): void;
  updateTypingStatus(roomId: string, isTyping: boolean): void;
}

const ws = createWsRef('Chat');

const chatWsEffects: ChatWsEffects = {
  postNewMessage(roomId: string, text: string) {
    ws.getClient().send(createSendMessage(text, roomId));
  },

  updateTypingStatus(roomId: string, isTyping: boolean) {
    ws.getClient().send(createTypingMessage(roomId, isTyping));
  },
};

export { chatWsEffects, ws as chatWs };
