import type { TimerClientMessage } from '../../../common/src';
import { TimerActions } from './actions';
import type { DomainHandlers } from '../ws/types';

export function createTimerHandlers(actions: TimerActions): DomainHandlers<TimerClientMessage> {
  return {
    'timer:start': async (payload, ctx) => {
      const state = await actions.startTimer(payload, ctx);
      await ctx.broadcastToRoom(state.roomId, {
        type: 'timer:state-changed',
        payload: state,
      });
    },
    'timer:pause': async (payload, ctx) => {
      const state = await actions.pauseTimer(payload, ctx);
      await ctx.broadcastToRoom(state.roomId, {
        type: 'timer:state-changed',
        payload: state,
      });
    },
    'timer:resume': async (payload, ctx) => {
      const state = await actions.resumeTimer(payload, ctx);
      await ctx.broadcastToRoom(state.roomId, {
        type: 'timer:state-changed',
        payload: state,
      });
    },
    'timer:reset': async (payload, ctx) => {
      const state = await actions.resetTimer(payload, ctx);
      await ctx.broadcastToRoom(state.roomId, {
        type: 'timer:state-changed',
        payload: state,
      });
    },
  };
}
