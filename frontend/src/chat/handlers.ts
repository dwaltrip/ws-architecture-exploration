import type { ChatServerMessage, HandlerMap } from '../../../common/src';
import { chatActions } from './actions';

type ChatHandlerMap = HandlerMap<ChatServerMessage>;

export const chatHandlers = {
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
  'chat:is-typing-in-room': (payload) => {
    const { roomId, userIds } = payload;
    const { setUsersTypingInRoom } = chatActions;
    setUsersTypingInRoom(roomId, userIds);
  },
} as const satisfies ChatHandlerMap;
