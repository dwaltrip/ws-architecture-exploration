import { createGameStore } from '../../db/game-store';

export const gameStore = createGameStore();

export function resetGameStoreForTests() {
  gameStore.reset();
}
