import type { GameStatePayload } from '../../../../common/src';
import type { ServerMessage } from '../../../../common/src';

export const GameMessageBuilders = {
  gameState(payload: GameStatePayload): ServerMessage {
    return {
      type: 'game:state',
      payload,
    };
  },
};
