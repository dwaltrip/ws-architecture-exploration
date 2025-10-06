import { createTimerStore } from '../../db/timer-store';

export const timerStore = createTimerStore();

export function resetTimerStoreForTests() {
  timerStore.reset();
}
