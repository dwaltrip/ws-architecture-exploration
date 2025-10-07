import { GRID_SIZE, MAX_SPAWN_ATTEMPTS } from '../../../../common/src/game/constants';
import type { GameMovePayload } from '../../../../common/src';

import { GameMessageBuilders } from './message-builders';
import { gameStore } from './store-singleton';
import { wsBridge } from '../../ws/bridge';
import { getUserColor } from '../../utils/user-color';

type UserContext = { userId: string };

export const gameActions = {
  joinGame(userId: string, username: string): void {
    console.log('[gameActions] joinGame', { userId, username });

    // Already in game
    if (gameStore.has(userId)) {
      console.warn('[gameActions] joinGame: user already in game', userId);
      return;
    }

    // Generate deterministic color
    const color = getUserColor(userId, username);

    // Try to find unoccupied position
    const position = findSpawnPosition();

    const player = {
      userId,
      username,
      x: position.x,
      y: position.y,
      color,
    };

    gameStore.set(userId, player);
  },

  movePlayer(payload: GameMovePayload, ctx: UserContext): void {
    console.log('[gameActions] movePlayer', { payload, ctx });

    const player = gameStore.get(ctx.userId);
    if (!player) {
      console.warn('[gameActions] movePlayer: player not in game', ctx.userId);
      return;
    }

    // Validate bounds
    if (payload.x < 0 || payload.x >= GRID_SIZE || payload.y < 0 || payload.y >= GRID_SIZE) {
      console.warn('[gameActions] movePlayer: out of bounds', payload);
      return;
    }

    // Update position
    player.x = payload.x;
    player.y = payload.y;
    gameStore.set(ctx.userId, player);
  },

  leaveGame(userId: string): void {
    console.log('[gameActions] leaveGame', { userId });
    gameStore.remove(userId);
  },

  getGameState() {
    return {
      players: gameStore.getAll(),
    };
  },

  broadcastGameState(): void {
    const state = gameActions.getGameState();
    wsBridge.broadcast(GameMessageBuilders.gameState(state));
  },
};

function findSpawnPosition(): { x: number; y: number } {
  const existingPlayers = gameStore.getAll();
  const occupiedPositions = new Set(
    existingPlayers.map(p => `${p.x},${p.y}`)
  );

  for (let attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt++) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    const posKey = `${x},${y}`;

    if (!occupiedPositions.has(posKey)) {
      return { x, y };
    }
  }

  // Grid is too crowded - throw error
  throw new Error(`Failed to find spawn position after ${MAX_SPAWN_ATTEMPTS} attempts`);
}
