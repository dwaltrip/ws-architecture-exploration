import type { HandlerMap } from '../../../common/src';
import type { SystemServerMessage } from '../../../common/src/system/server-messages';
import { systemActions } from './actions';
import { useUserStore } from '../stores/user-store';

type SystemHandlerMap = HandlerMap<SystemServerMessage>;

export const systemHandlers = {
  'system:users-for-room': (payload) => {
    systemActions.setUsersForRoom(payload.roomId, payload.users);
  },
  'system:user-info': (payload) => {
    useUserStore.getState().setUser(payload.userId, payload.username);
  },
} as const satisfies SystemHandlerMap;
