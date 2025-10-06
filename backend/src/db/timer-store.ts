import type { TimerStatus } from '../../../common/src';

export interface TimerState {
  status: TimerStatus;
  totalDurationSeconds: number;
  remainingSeconds: number;
  startedAt: number | null;
}

type TimerStore = {
  get(roomId: string): TimerState;
  set(roomId: string, state: TimerState): void;
  reset(): void;
};

export function createTimerStore(): TimerStore {
  const timers = new Map<string, TimerState>();

  const defaultState: TimerState = {
    status: 'idle',
    totalDurationSeconds: 0,
    remainingSeconds: 0,
    startedAt: null,
  };

  return {
    get(roomId) {
      return timers.get(roomId) ?? defaultState;
    },
    set(roomId, state) {
      timers.set(roomId, state);
    },
    reset() {
      timers.clear();
    },
  };
}
