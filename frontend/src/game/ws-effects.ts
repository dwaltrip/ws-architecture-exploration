import type { ClientMessage } from '../../../common/src';
import { createWsRef } from '../ws/create-ws-ref';

type GameJoinMessage = Extract<ClientMessage, { type: 'game:join' }>;
type GameMoveMessage = Extract<ClientMessage, { type: 'game:move' }>;
type GameLeaveMessage = Extract<ClientMessage, { type: 'game:leave' }>;

interface GameWsEffects {
  joinGame(): void;
  movePlayer(x: number, y: number): void;
  leaveGame(): void;
}

const ws = createWsRef('Game');

const gameWsEffects: GameWsEffects = {
  joinGame() {
    const message: GameJoinMessage = {
      type: 'game:join',
      payload: {},
    };
    ws.getClient().send(message);
  },

  movePlayer(x: number, y: number) {
    const message: GameMoveMessage = {
      type: 'game:move',
      payload: { x, y },
    };
    ws.getClient().send(message);
  },

  leaveGame() {
    const message: GameLeaveMessage = {
      type: 'game:leave',
      payload: {},
    };
    ws.getClient().send(message);
  },
};

export { gameWsEffects, ws as gameWs };
