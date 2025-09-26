import type { ChatServerMessage } from '../../../common/src';
import type { HandlerMap } from '../../../common/src';
import {
  addNewMessage,
  updateMessageWithEdits,
  updateIsTypingStatus,
} from './actions';
import { createHandlerMap } from '../../../common/src';

// Keeping this file as a scratchpad while we iterate on the handler shape.

const chatHandlersIdea1: HandlerMap<ChatServerMessage> = {
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
};

const chatHandlersIdea2 = createHandlerMap<ChatServerMessage>({
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

export { chatHandlersIdea1, chatHandlersIdea2 };
