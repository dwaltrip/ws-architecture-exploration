import type { ChatServerMessage, HandlerMap } from '../../../common/src';
// import { createHandlerMap } from '../../../common/src';

import type { ChatActions } from "./types";

type ChatHandlerMap = HandlerMap<ChatServerMessage>;

// const chatHandlers: ChatHandlerMap = createHandlerMap<ChatServerMessage>({
// --------------------------------------------------------------------------
// QUESTION: Does createHandlerMap do anything different than directly typing
//    the object literal??
// --------------------------------------------------------------------------

interface Deps {
  getChatActions: () => ChatActions;
}

function createChatHandlers({ getChatActions }: Deps): ChatHandlerMap {
  return {
    'chat:message': (payload) => {
      const { id, text, userId } = payload;
      const { addReceivedMessage } = getChatActions();
      addReceivedMessage({ id, content: text, user: { id: userId, name: 'User ' + userId } });
    },
    'chat:edited': (payload) => {
      // const { messageId, newText } = payload;
      // updateMessageWithEdits(messageId, newText);
    },
    'chat:typing': (payload) => {
      // const { roomId, userId, isTyping } = payload;
      // updateIsTypingStatus(roomId, userId, isTyping);
    },
  };
}

const getChatHandlers = (function () {
  let chatHandlers: ChatHandlerMap | null = null;

  return function getChatHandlers(deps: Deps): ChatHandlerMap {
    if (!chatHandlers) {
      chatHandlers = createChatHandlers(deps);
    }
    return chatHandlers;
  };
})();

export type { ChatHandlerMap };
export { getChatHandlers };
