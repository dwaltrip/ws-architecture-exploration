import type { HandlerMap } from '../../../common/src';
import type { SystemServerMessage } from '../../../common/src/system/server-messages';

import { getWsClient } from '../ws/create-client';
import { systemActions } from './actions'

type ServerHandlerMap = HandlerMap<SystemServerMessage>;

const systemHandlers: ServerHandlerMap = {
  'system:users-for-room': (payload) => {
    systemActions.setUsersForRoom(payload.roomId, payload.users);
  }
};

let handlersRegistered = false;

function registerSystemHandlers(): void {
  if (handlersRegistered) {
    return;
  }

  getWsClient().registerHandlers(systemHandlers);
  handlersRegistered = true;
}

export type { ServerHandlerMap };
export { systemHandlers, registerSystemHandlers };
