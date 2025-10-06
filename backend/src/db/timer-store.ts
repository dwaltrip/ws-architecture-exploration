import type { TimerStatus } from '../../../common/src';

export interface TimerState {
  status: TimerStatus;
  totalDurationSeconds: number;
  remainingSeconds: number;
  startedAt: number | null;
}

type TimerStore = {
  get(roomId: string): TimerState;
  getAll(): [string, TimerState][];
  count(): number;
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
      return timers.get(roomId) ?? { ...defaultState };
    },
    getAll() {
      return Array.from(timers.entries());
    },
    count() {
      return timers.size;
    },
    set(roomId, state) {
      timers.set(roomId, state);
    },
    reset() {
      timers.clear();
    },
  };
}
