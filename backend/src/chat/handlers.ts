import type { ChatClientMessage } from '../../../common/src';
import { ChatActions } from './actions';
import { ChatMessageBuilders } from './message-builders';
import type { DomainHandlers } from '../ws/types';

export function createChatHandlers(actions: ChatActions): DomainHandlers<ChatClientMessage> {
  return {
    'chat:send': (payload, ctx) => {
      const message = actions.sendMessage(payload, ctx);
      ctx.broadcastToRoom(
        message.roomId,
        ChatMessageBuilders.message(message)
      );
    },
    'chat:edit': (payload, ctx) => {
      const updated = actions.editMessage(payload, ctx);
      ctx.broadcastToRoom(
        updated.roomId,
        ChatMessageBuilders.edited({
          messageId: updated.messageId,
          newText: updated.newText,
          editedBy: updated.editedBy,
        })
      );
    },
    'chat:typing': (payload, ctx) => {
      const typingState = actions.setTypingState(payload, ctx);
      ctx.broadcastToRoom(
        typingState.roomId,
        ChatMessageBuilders.typing(typingState),
        true
      );
    },
  };
}
