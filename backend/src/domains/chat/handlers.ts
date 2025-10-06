import type { ChatClientMessage } from '../../../../common/src';
import type { HandlerMapWithCtx } from '../../../../common/src/utils/message-helpers';
import type { HandlerContext } from '../../ws/types';
import { chatActions } from './actions';

export const chatHandlers = {
  'chat:send': (payload, ctx) => {
    chatActions.sendMessage(payload, { userId: ctx.userId, username: ctx.username });
  },
  'chat:edit': (payload, ctx) => {
    chatActions.editMessage(payload, { userId: ctx.userId, username: ctx.username });
  },
  'chat:typing': (payload, ctx) => {
    chatActions.setTypingState(payload, { userId: ctx.userId, username: ctx.username });
  },
} satisfies HandlerMapWithCtx<ChatClientMessage, HandlerContext>;
