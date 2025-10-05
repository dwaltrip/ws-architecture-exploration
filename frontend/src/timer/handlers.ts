import type { TimerServerMessage, HandlerMap } from '../../../common/src';
import { timerActions } from './actions';

type TimerHandlerMap = HandlerMap<TimerServerMessage>;

export const timerHandlers = {
  'timer:state-changed': (payload) => {
    timerActions.updateTimerState(payload);
  },
} as const satisfies TimerHandlerMap;
