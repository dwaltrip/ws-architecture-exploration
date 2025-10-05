import type { TimerStateChangedPayload } from '../../../common/src';
import { timerStore } from './timer-store';
import { timerWsEffects } from './ws-effects';

interface TimerActions {
  startTimer: (roomId: string, durationSeconds: number) => void;
  pauseTimer: (roomId: string) => void;
  resumeTimer: (roomId: string) => void;
  resetTimer: (roomId: string) => void;
  updateTimerState: (payload: TimerStateChangedPayload) => void;
}

const timerActions: TimerActions = {
  startTimer(roomId: string, durationSeconds: number) {
    timerWsEffects.startTimer(roomId, durationSeconds);
  },

  pauseTimer(roomId: string) {
    timerWsEffects.pauseTimer(roomId);
  },

  resumeTimer(roomId: string) {
    timerWsEffects.resumeTimer(roomId);
  },

  resetTimer(roomId: string) {
    timerWsEffects.resetTimer(roomId);
  },

  updateTimerState(payload: TimerStateChangedPayload) {
    console.log('[TimerActions] updateTimerState', payload);
    timerStore.getState().actions.updateTimerForRoom(payload.roomId, {
      status: payload.status,
      remainingSeconds: payload.remainingSeconds,
      totalDurationSeconds: payload.totalDurationSeconds,
      startedAt: payload.startedAt,
    });
  },
};

function useTimerActions(): TimerActions {
  return timerActions;
}

export type { TimerActions };
export { timerActions, useTimerActions };
