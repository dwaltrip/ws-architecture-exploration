import type {
  TimerStartPayload,
  TimerPausePayload,
  TimerResetPayload,
  TimerResumePayload,
  TimerStateChangedPayload,
} from '../../../../common/src';
import { timerStore } from './store-singleton';
import { wsBridge } from '../../ws/bridge';
import type { TimerState } from '../../db/timer-store';

type UserContext = { userId: string; };

const stateChangMsg = (payload: TimerStateChangedPayload) => ({
  type: 'timer:state-changed' as const,
  payload,
});

export const timerActions = {
  startTimer(payload: TimerStartPayload, ctx?: UserContext) {
    console.log('[timerActions] startTimer', { payload, ctx });

    const state: TimerState = {
      status: 'running',
      totalDurationSeconds: payload.durationSeconds,
      remainingSeconds: payload.durationSeconds,
      startedAt: Date.now(),
    };
    timerStore.set(payload.roomId, state);

    const statePayload: TimerStateChangedPayload = {
      roomId: payload.roomId,
      ...state,
    };
    wsBridge.broadcastToRoom(payload.roomId, stateChangMsg(statePayload));
  },

  tickTimers() {
    if (timerStore.count() === 0) {
      return;
    }

    let hasChanges = false;
    timerStore.getAll().forEach(([roomId, timer]) => {
      if (timer.status !== 'running' || !timer.startedAt) {
        return;
      }
      timer.remainingSeconds = Math.max(0, timer.remainingSeconds - 1);
      if (timer.remainingSeconds === 0) {
        timer.status = 'idle';
      }
      wsBridge.broadcastToRoom(roomId, stateChangMsg({ roomId, ...timer}));
      hasChanges = true;
    });
  },

  pauseTimer(payload: TimerPausePayload, ctx?: UserContext) {
    console.log('[timerActions] pauseTimer', { payload, ctx });

    const current = timerStore.get(payload.roomId);
    if (current.status !== 'running') {
      return;
    }

    const state: TimerState = {
      ...current,
      status: 'paused',
    };
    timerStore.set(payload.roomId, state);

    wsBridge.broadcastToRoom(
      payload.roomId,
      stateChangMsg({ roomId: payload.roomId, ...state }),
    );
  },

  resumeTimer(payload: TimerResumePayload, ctx?: UserContext) {
    console.log('[timerActions] resumeTimer', { payload, ctx });

    const current = timerStore.get(payload.roomId);
    if (current.status !== 'paused') {
      return;
    }

    const state: TimerState = {
      ...current,
      status: 'running',
      startedAt: Date.now(),
    };
    timerStore.set(payload.roomId, state);

    wsBridge.broadcastToRoom(
      payload.roomId, 
      stateChangMsg({ roomId: payload.roomId, ...state }),
    );
  },

  resetTimer(payload: TimerResetPayload, ctx?: UserContext) {
    console.log('[timerActions] resetTimer', { payload, ctx });

    const state: TimerState = {
      status: 'idle',
      totalDurationSeconds: 0,
      remainingSeconds: 0,
      startedAt: null,
    };
    timerStore.set(payload.roomId, state);

    wsBridge.broadcastToRoom(
      payload.roomId, 
      stateChangMsg({ roomId: payload.roomId, ...state }),
    );
  },
};
