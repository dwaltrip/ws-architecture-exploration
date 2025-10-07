import { create } from 'zustand';
import type { GamePlayer } from '../../../common/src';

interface GameStoreState {
  players: GamePlayer[];

  actions: {
    setPlayers: (players: GamePlayer[]) => void;
  };
}

const useGameStore = create<GameStoreState>((set) => ({
  players: [],

  actions: {
    setPlayers: (players) => set({ players }),
  },
}));

const gameStore = useGameStore;

function getGameStore(): typeof gameStore {
  return gameStore;
}

export { useGameStore, gameStore, getGameStore };
