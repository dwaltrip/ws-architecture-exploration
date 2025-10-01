import type { ChatClientMessage } from '../../../common/src';
import { ChatActions } from './actions';
import { ChatMessageBuilders } from './message-builders';
import type { DomainHandlers } from '../ws/types';

export function createChatHandlers(actions: ChatActions): DomainHandlers<ChatClientMessage> {
  return {
    'chat:send': async (payload, ctx) => {
      const message = await actions.sendMessage(payload, ctx);
      await ctx.broadcastToRoom(
        message.roomId,
        ChatMessageBuilders.chat.message(message)
      );
    },
    'chat:edit': async (payload, ctx) => {
      const updated = await actions.editMessage(payload, ctx);
      await ctx.broadcastToRoom(
        updated.roomId,
        ChatMessageBuilders.chat.edited({
          messageId: updated.messageId,
          newText: updated.newText,
          editedBy: updated.editedBy,
        })
      );
    },
    'chat:typing': async (payload, ctx) => {
      const typingState = await actions.setTypingState(payload, ctx);
      await ctx.broadcastToRoom(
        typingState.roomId,
        ChatMessageBuilders.chat.typing(typingState),
        true
      );
    },
  };
}
