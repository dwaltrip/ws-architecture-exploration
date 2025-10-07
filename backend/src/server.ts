import type { ClientMessage } from '../../common/src';
import type { HandlerMapWithCtx } from '../../common/src/utils/message-helpers';
import type { HandlerContext } from './ws/types';
import { chatHandlers } from './domains/chat';
import { systemHandlers } from './domains/system';
import { timerHandlers } from './domains/timer';
import { createWSServer } from './ws';
import { wsBridge } from './ws/bridge';
import { initTimerTick } from './domains/timer/init';

function startExampleServer(port = 3000) {
  const handlers = {
    ...chatHandlers,
    ...systemHandlers,
    ...timerHandlers,
  } satisfies HandlerMapWithCtx<ClientMessage, HandlerContext>;

  const server = createWSServer(port, handlers);

  // Initialize the bridge with transport capabilities
  wsBridge.init({
    broadcast: server.broadcast,
    broadcastToRoom: server.broadcastToRoom,
    sendToUser: server.sendToUser,
    rooms: server.rooms,
  });

  // Start the timer tick process
  initTimerTick();
}

startExampleServer();
