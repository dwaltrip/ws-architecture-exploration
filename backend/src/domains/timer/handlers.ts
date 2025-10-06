import type { TimerClientMessage } from '../../../../common/src';
import type { HandlerMapWithCtx } from '../../../../common/src/utils/message-helpers';
import type { HandlerContext } from '../../ws/types';
import { timerActions } from './actions';

export const timerHandlers = {
  'timer:start': (payload, ctx) => {
    timerActions.startTimer(payload, { userId: ctx.userId, username: ctx.username });
  },
  'timer:pause': (payload, ctx) => {
    timerActions.pauseTimer(payload, { userId: ctx.userId, username: ctx.username });
  },
  'timer:resume': (payload, ctx) => {
    timerActions.resumeTimer(payload, { userId: ctx.userId, username: ctx.username });
  },
  'timer:reset': (payload, ctx) => {
    timerActions.resetTimer(payload, { userId: ctx.userId, username: ctx.username });
  },
} satisfies HandlerMapWithCtx<TimerClientMessage, HandlerContext>;
