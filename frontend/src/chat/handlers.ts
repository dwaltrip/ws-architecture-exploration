import type { ChatServerMessage } from '../../../common/src';
import {
  addNewMessage,
  updateMessageWithEdits,
  updateIsTypingStatus,
} from './actions';
import { createHandlerMap } from '../../../common/src';

const chatHandlers = createHandlerMap<ChatServerMessage>({
  'chat:message': (payload) => {
    const { text, roomId, userId } = payload;
    addNewMessage(text, roomId, userId);
  },
  'chat:edited': (payload) => {
    const { messageId, newText } = payload;
    updateMessageWithEdits(messageId, newText);
  },
  'chat:typing': (payload) => {
    const { roomId, userId, isTyping } = payload;
    updateIsTypingStatus(roomId, userId, isTyping);
  },
});

export { chatHandlers };
