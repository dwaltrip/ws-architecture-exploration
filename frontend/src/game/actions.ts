import type { GameStatePayload } from '../../../common/src';
import { gameStore } from './game-store';
import { gameWsEffects } from './ws-effects';

interface GameActions {
  joinGame: () => void;
  movePlayer: (x: number, y: number) => void;
  leaveGame: () => void;
  updateGameState: (payload: GameStatePayload) => void;
}

const gameActions: GameActions = {
  joinGame() {
    gameWsEffects.joinGame();
  },

  movePlayer(x: number, y: number) {
    gameWsEffects.movePlayer(x, y);
  },

  leaveGame() {
    gameWsEffects.leaveGame();
  },

  updateGameState(payload: GameStatePayload) {
    // console.log('[GameActions] updateGameState', payload);
    gameStore.getState().actions.setPlayers(payload.players);
  },
};

function useGameActions(): GameActions {
  return gameActions;
}

export type { GameActions };
export { gameActions, useGameActions };
