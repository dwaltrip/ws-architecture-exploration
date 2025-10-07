import type { ClientMessage, ServerMessage } from '../../common/src';
import type { HandlerMapWithCtx } from '../../common/src/utils/message-helpers';
import type { HandlerContext } from './ws/types';
import { chatHandlers } from './domains/chat';
import { systemHandlers } from './domains/system';
import { timerHandlers } from './domains/timer';
import { createWSServer } from './ws';
import { wsBridge } from './ws/bridge';
import { initTimerTick } from './domains/timer/init';
import { createUser, removeUser } from './domains/system/actions.js';
import { buildUserInfoMessage } from './domains/system/message-builders.js';

function startExampleServer(port = 3000) {
  const handlers = {
    ...chatHandlers,
    ...systemHandlers,
    ...timerHandlers,
  } satisfies HandlerMapWithCtx<ClientMessage, HandlerContext>;

  const server = createWSServer<ClientMessage, ServerMessage, HandlerContext>({
    port,
    handlers,
    onConnection: (socket) => {
      const user = createUser();
      console.log(`Client connected -- ${user.userId}`);
      socket.send(JSON.stringify(buildUserInfoMessage(user.userId, user.username)));
      return user.userId;
    },
    createContext: (userId) => {
      return { userId } satisfies HandlerContext;
    },
    getUserId: (ctx) => ctx.userId,
    onDisconnect: (userId) => {
      removeUser(userId);
    },
  });

  // Initialize the bridge with transport capabilities
  wsBridge.init(server);

  // Start the timer tick process
  initTimerTick();
}

startExampleServer();
