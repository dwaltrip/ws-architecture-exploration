import type { TimerStatus } from '../../../common/src';

export interface TimerState {
  status: TimerStatus;
  totalDurationSeconds: number;
  remainingSeconds: number;
  startedAt: number | null;
}

export class TimerService {
  private timers: Map<string, TimerState> = new Map();

  getTimerState(roomId: string): TimerState {
    return this.timers.get(roomId) || {
      status: 'idle',
      totalDurationSeconds: 0,
      remainingSeconds: 0,
      startedAt: null,
    };
  }

  startTimer(roomId: string, durationSeconds: number): TimerState {
    const state: TimerState = {
      status: 'running',
      totalDurationSeconds: durationSeconds,
      remainingSeconds: durationSeconds,
      startedAt: Date.now(),
    };
    this.timers.set(roomId, state);
    return state;
  }

  pauseTimer(roomId: string): TimerState {
    const current = this.getTimerState(roomId);

    if (current.status !== 'running') {
      return current;
    }

    const elapsed = current.startedAt ? (Date.now() - current.startedAt) / 1000 : 0;
    const remaining = Math.max(0, current.remainingSeconds - elapsed);

    const state: TimerState = {
      ...current,
      status: 'paused',
      remainingSeconds: remaining,
      startedAt: null,
    };
    this.timers.set(roomId, state);
    return state;
  }

  resumeTimer(roomId: string): TimerState {
    const current = this.getTimerState(roomId);

    if (current.status !== 'paused') {
      return current;
    }

    const state: TimerState = {
      ...current,
      status: 'running',
      startedAt: Date.now(),
    };
    this.timers.set(roomId, state);
    return state;
  }

  resetTimer(roomId: string): TimerState {
    const state: TimerState = {
      status: 'idle',
      totalDurationSeconds: 0,
      remainingSeconds: 0,
      startedAt: null,
    };
    this.timers.set(roomId, state);
    return state;
  }
}
