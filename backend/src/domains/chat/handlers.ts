import type { ChatClientMessage } from '../../../../common/src';
import type { HandlerMapWithCtx } from '../../../../common/src/utils/message-helpers';
import type { HandlerContext } from '../../ws/types';
import { chatActions } from './actions';

export const chatHandlers = {
  'chat:send': (payload, ctx) => {
    chatActions.sendMessage(payload, { userId: ctx.userId });
  },
  'chat:typing': (payload, ctx) => {
    chatActions.setTypingState(payload, { userId: ctx.userId });
  },
} satisfies HandlerMapWithCtx<ChatClientMessage, HandlerContext>;
