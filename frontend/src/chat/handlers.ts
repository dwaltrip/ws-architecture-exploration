import type { ChatServerMessage, HandlerMap } from '../../../common/src';
// import { createHandlerMap } from '../../../common/src';

import { getChatActions, type ChatActions } from './actions';


type ChatHandlerMap = HandlerMap<ChatServerMessage>;

// const chatHandlers: ChatHandlerMap = createHandlerMap<ChatServerMessage>({
// --------------------------------------------------------------------------
// QUESTION: Does createHandlerMap do anything different than directly typing
//    the object literal??
// --------------------------------------------------------------------------
function createChatHandlers(actions: ChatActions): ChatHandlerMap {
  const { addReceivedMessage } = actions;
  return {
    'chat:message': (payload) => {
      const { id, text, userId } = payload;
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
  return function getChatHandlers(): ChatHandlerMap {
    if (!chatHandlers) {
      chatHandlers = createChatHandlers(getChatActions());
    }
    return chatHandlers;
  };
})();

export type { ChatHandlerMap };
export { getChatHandlers };
