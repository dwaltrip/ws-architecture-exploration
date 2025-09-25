import type { WSClient } from '../ws';
import {
  addNewMessage,
  updateMessageWithEdits,
  updateIsTypingStatus,
} from './actions';

export function registerChatHandlers(client: WSClient) {
  const unsubscribes = [
    client.on('chat:message', (payload) => {
      const { text, roomId, userId } = payload;
      addNewMessage(text, roomId, userId);
    }),
    client.on('chat:edited', (payload) => {
      const { messageId, newText } = payload;
      updateMessageWithEdits(messageId, newText);
    }),
    client.on('chat:typing', (payload) => {
      const { roomId, userId, isTyping } = payload;
      updateIsTypingStatus(roomId, userId, isTyping);
    }),
  ];

  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  };
}
