import type { HandlerMap } from '../../../common/src';
import type { SystemServerMessage } from '../../../common/src/system/server-messages';

import { getWsClient } from '../ws/create-client';
import { systemActions } from './actions'

type ServerHandlerMap = HandlerMap<SystemServerMessage>;

const systemHandlers: ServerHandlerMap = {
  'system:users-for-room': (payload) => {
    systemActions.setUsersForRoom(payload.roomId, payload.userIds);
  }
};
