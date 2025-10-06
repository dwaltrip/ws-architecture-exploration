import type { TimerClientMessage } from '../../../common/src';
import { TimerActions } from './actions';
import type { DomainHandlers } from '../ws/types';

export function createTimerHandlers(actions: TimerActions): DomainHandlers<TimerClientMessage> {
  return {
    'timer:start': async (payload, ctx) => {
      const state = actions.startTimer(payload, ctx);
      ctx.broadcastToRoom(state.roomId, {
        type: 'timer:state-changed',
        payload: state,
      });
    },
    'timer:pause': async (payload, ctx) => {
      const state = actions.pauseTimer(payload, ctx);
      ctx.broadcastToRoom(state.roomId, {
        type: 'timer:state-changed',
        payload: state,
      });
    },
    'timer:resume': async (payload, ctx) => {
      const state = actions.resumeTimer(payload, ctx);
      ctx.broadcastToRoom(state.roomId, {
        type: 'timer:state-changed',
        payload: state,
      });
    },
    'timer:reset': async (payload, ctx) => {
      const state = actions.resetTimer(payload, ctx);
      ctx.broadcastToRoom(state.roomId, {
        type: 'timer:state-changed',
        payload: state,
      });
    },
  };
}
