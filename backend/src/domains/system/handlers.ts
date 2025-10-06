import type { SystemClientMessage } from '../../../../common/src';
import type { HandlerMapWithCtx } from '../../../../common/src/utils/message-helpers';
import type { HandlerContext } from '../../ws/types';
import { systemActions } from './actions';

export const systemHandlers = {
  'system:room-join': (payload, ctx) => {
    systemActions.joinRoom(payload, { userId: ctx.userId });
  },
  'system:room-leave': (payload, ctx) => {
    systemActions.leaveRoom(payload, { userId: ctx.userId });
  },
} satisfies HandlerMapWithCtx<SystemClientMessage, HandlerContext>;
