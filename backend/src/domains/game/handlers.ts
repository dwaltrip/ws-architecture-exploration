import type { GameClientMessage } from '../../../../common/src';
import type { HandlerMapWithCtx } from '../../../../common/src/utils/message-helpers';
import type { HandlerContext } from '../../ws/types';
import { gameActions } from './actions';
import { getUser } from '../system/actions';

export const gameHandlers = {
  'game:join': (payload, ctx) => {
    const user = getUser(ctx.userId);
    if (!user) {
      console.error('[gameHandlers] game:join: user not found', ctx.userId);
      return;
    }
    gameActions.joinGame(ctx.userId, user.username);
  },
  'game:move': (payload, ctx) => {
    gameActions.movePlayer(payload, { userId: ctx.userId });
  },
  'game:leave': (payload, ctx) => {
    gameActions.leaveGame(ctx.userId);
  },
} satisfies HandlerMapWithCtx<GameClientMessage, HandlerContext>;
