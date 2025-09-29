import type { ChatServerMessage, HandlerMap } from '../../../common/src';

import { getWsClient } from '../ws/create-client';
import { chatActions } from './actions';

type ChatHandlerMap = HandlerMap<ChatServerMessage>;

const chatHandlers: ChatHandlerMap = {
  'chat:message': (payload) => {
    const { id, text, userId } = payload;
    const { addReceivedMessage } = chatActions;
    addReceivedMessage({
      id,
      content: text,
      user: { id: userId, name: 'User ' + userId },
    });
  },
  'chat:edited': (_payload) => {
    // const { messageId, newText } = payload;
    // updateMessageWithEdits(messageId, newText);
  },
  'chat:typing': (_payload) => {
    // const { roomId, userId, isTyping } = payload;
    // updateIsTypingStatus(roomId, userId, isTyping);
  },
};

let handlersRegistered = false;

function registerChatHandlers(): void {
  if (handlersRegistered) {
    return;
  }

  getWsClient().registerHandlers(chatHandlers);
  handlersRegistered = true;
}

export type { ChatHandlerMap };
export { chatHandlers, registerChatHandlers };
