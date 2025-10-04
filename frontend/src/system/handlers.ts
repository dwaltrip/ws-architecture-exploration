import type { HandlerMap } from '../../../common/src';
import type { SystemServerMessage } from '../../../common/src/system/server-messages';
import { systemActions } from './actions';

type SystemHandlerMap = HandlerMap<SystemServerMessage>;

export const systemHandlers = {
  'system:users-for-room': (payload) => {
    systemActions.setUsersForRoom(payload.roomId, payload.users);
  },
} as const satisfies SystemHandlerMap;
