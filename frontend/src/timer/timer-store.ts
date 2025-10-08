import { create } from 'zustand';
import type { TimerStatus, ChatRoomId } from '../../../common/src';

export interface TimerState {
  status: TimerStatus;
  remainingSeconds: number;
  totalDurationSeconds: number;
}

interface TimerStoreState {
  timersByRoom: Record<ChatRoomId, TimerState>;

  actions: {
    updateTimerForRoom: (roomId: ChatRoomId, state: TimerState) => void;
  };
}

const DEFAULT_TIMER_STATE: TimerState = {
  status: 'idle',
  remainingSeconds: 0,
  totalDurationSeconds: 0,
};

const useTimerStore = create<TimerStoreState>((set) => ({
  timersByRoom: {},

  actions: {
    updateTimerForRoom: (roomId, state) =>
      set((prev) => ({
        timersByRoom: {
          ...prev.timersByRoom,
          [roomId]: state,
        },
      })),
  },
}));

const timerStore = useTimerStore;

function getTimerStore(): typeof timerStore {
  return timerStore;
}

// --------- selectors ---------

function selectTimerForRoom(roomId: ChatRoomId) {
  return (state: TimerStoreState): TimerState => {
    return state.timersByRoom[roomId] || DEFAULT_TIMER_STATE;
  };
}

// -----------------------------

export { useTimerStore, timerStore, getTimerStore, selectTimerForRoom };
