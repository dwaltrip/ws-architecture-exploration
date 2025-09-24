import type { ChatClientMessage } from '../../../common/src';
import { ChatActions } from './actions';
import { ActionError } from '../ws/errors';
import { ServerMessages } from '../ws/messages';
import type { DomainHandlers } from '../ws/types';

export function createChatHandlers(actions: ChatActions): DomainHandlers<ChatClientMessage> {
  return {
    'chat:send': async (payload, ctx) => {
      try {
        const message = await actions.sendMessage(payload, ctx);
        await ctx.broadcastToRoom(
          message.roomId,
          ServerMessages.chat.message(message)
        );
      } catch (error) {
        handleActionError(error, ctx);
      }
    },
    'chat:edit': async (payload, ctx) => {
      try {
        const updated = await actions.editMessage(payload, ctx);
        await ctx.broadcastToRoom(
          updated.roomId,
          ServerMessages.chat.edited({
            messageId: updated.id,
            newText: updated.text,
            editedBy: ctx.username,
          })
        );
      } catch (error) {
        handleActionError(error, ctx);
      }
    },
    'chat:typing': async (payload, ctx) => {
      try {
        const typingState = await actions.setTypingState(payload, ctx);
        await ctx.broadcastToRoom(
          typingState.roomId,
          ServerMessages.chat.typing(typingState),
          true
        );
      } catch (error) {
        handleActionError(error, ctx);
      }
    },
  };
}

function handleActionError(error: unknown, ctx: { sendError: (code: string, message: string) => void }) {
  if (error instanceof ActionError) {
    ctx.sendError(error.code, error.message);
    return;
  }

  throw error;
}
