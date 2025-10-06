import type {
  TimerStartPayload,
  TimerPausePayload,
  TimerResetPayload,
  TimerResumePayload,
  TimerStateChangedPayload,
} from '../../../../common/src';
import { TimerMessageBuilders } from './message-builders';
import { timerStore } from './store-singleton';
import { wsBridge } from '../../ws/bridge';
import type { TimerState } from '../../db/timer-store';

type UserContext = { userId: string; username: string };

export const timerActions = {
  startTimer(payload: TimerStartPayload, ctx?: UserContext): TimerStateChangedPayload {
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
      status: state.status,
      remainingSeconds: state.remainingSeconds,
      totalDurationSeconds: state.totalDurationSeconds,
      startedAt: state.startedAt,
    };

    wsBridge.get().broadcastToRoom(payload.roomId, TimerMessageBuilders.stateChanged(statePayload));

    return statePayload;
  },

  pauseTimer(payload: TimerPausePayload, ctx?: UserContext): TimerStateChangedPayload {
    console.log('[timerActions] pauseTimer', { payload, ctx });

    const current = timerStore.get(payload.roomId);

    if (current.status !== 'running') {
      const statePayload: TimerStateChangedPayload = {
        roomId: payload.roomId,
        status: current.status,
        remainingSeconds: current.remainingSeconds,
        totalDurationSeconds: current.totalDurationSeconds,
        startedAt: current.startedAt,
      };
      return statePayload;
    }

    const elapsed = current.startedAt ? (Date.now() - current.startedAt) / 1000 : 0;
    const remaining = Math.max(0, current.remainingSeconds - elapsed);

    const state: TimerState = {
      ...current,
      status: 'paused',
      remainingSeconds: remaining,
      startedAt: null,
    };

    timerStore.set(payload.roomId, state);

    const statePayload: TimerStateChangedPayload = {
      roomId: payload.roomId,
      status: state.status,
      remainingSeconds: state.remainingSeconds,
      totalDurationSeconds: state.totalDurationSeconds,
      startedAt: state.startedAt,
    };

    wsBridge.get().broadcastToRoom(payload.roomId, TimerMessageBuilders.stateChanged(statePayload));

    return statePayload;
  },

  resumeTimer(payload: TimerResumePayload, ctx?: UserContext): TimerStateChangedPayload {
    console.log('[timerActions] resumeTimer', { payload, ctx });

    const current = timerStore.get(payload.roomId);

    if (current.status !== 'paused') {
      const statePayload: TimerStateChangedPayload = {
        roomId: payload.roomId,
        status: current.status,
        remainingSeconds: current.remainingSeconds,
        totalDurationSeconds: current.totalDurationSeconds,
        startedAt: current.startedAt,
      };
      return statePayload;
    }

    const state: TimerState = {
      ...current,
      status: 'running',
      startedAt: Date.now(),
    };

    timerStore.set(payload.roomId, state);

    const statePayload: TimerStateChangedPayload = {
      roomId: payload.roomId,
      status: state.status,
      remainingSeconds: state.remainingSeconds,
      totalDurationSeconds: state.totalDurationSeconds,
      startedAt: state.startedAt,
    };

    wsBridge.get().broadcastToRoom(payload.roomId, TimerMessageBuilders.stateChanged(statePayload));

    return statePayload;
  },

  resetTimer(payload: TimerResetPayload, ctx?: UserContext): TimerStateChangedPayload {
    console.log('[timerActions] resetTimer', { payload, ctx });

    const state: TimerState = {
      status: 'idle',
      totalDurationSeconds: 0,
      remainingSeconds: 0,
      startedAt: null,
    };

    timerStore.set(payload.roomId, state);

    const statePayload: TimerStateChangedPayload = {
      roomId: payload.roomId,
      status: state.status,
      remainingSeconds: state.remainingSeconds,
      totalDurationSeconds: state.totalDurationSeconds,
      startedAt: state.startedAt,
    };

    wsBridge.get().broadcastToRoom(payload.roomId, TimerMessageBuilders.stateChanged(statePayload));

    return statePayload;
  },
};
