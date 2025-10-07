import type { GameServerMessage, HandlerMap } from '../../../common/src';
import { gameActions } from './actions';

type GameHandlerMap = HandlerMap<GameServerMessage>;

export const gameHandlers = {
  'game:state': (payload) => {
    gameActions.updateGameState(payload);
  },
} as const satisfies GameHandlerMap;
