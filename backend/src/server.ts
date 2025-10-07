import { randomUUID } from 'crypto';

import type { ClientMessage, ServerMessage } from '../../common/src';
import type { HandlerMapWithCtx } from '../../common/src/utils/message-helpers';
import type { HandlerContext } from './ws/types';
import { chatHandlers } from './domains/chat';
import { systemHandlers } from './domains/system';
import { timerHandlers } from './domains/timer';
import { createWSServer } from './ws';
import { wsBridge } from './ws/bridge';
import { initTimerTick } from './domains/timer/init';

function generateUser() {
  const userId = randomUUID().slice(0, 12);
  const username = `User ${userId.slice(0, 8)}`;
  return { userId, username };
}

function startExampleServer(port = 3000) {
  const handlers = {
    ...chatHandlers,
    ...systemHandlers,
    ...timerHandlers,
  } satisfies HandlerMapWithCtx<ClientMessage, HandlerContext>;

  const server = createWSServer<ClientMessage, ServerMessage, HandlerContext>({
    port,
    handlers,
    createContext: (_details) => {
      const { userId, username } = generateUser();
      console.log(`Client connected -- ${userId}`);
      return { userId, username } satisfies HandlerContext;
    },
    getUserId: (ctx) => ctx.userId,
  });

  // Initialize the bridge with transport capabilities
  wsBridge.init(server);

  // Start the timer tick process
  initTimerTick();
}

startExampleServer();
