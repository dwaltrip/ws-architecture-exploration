import { randomUUID } from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import type { ClientMessage } from '../../common/src';
import type { HandlerMapWithCtx } from '../../common/src/utils/message-helpers';
import type { HandlerContext } from './ws/types';
import { chatHandlers } from './domains/chat';
import { systemHandlers } from './domains/system';
import { timerHandlers } from './domains/timer';
import { createWSServer } from './ws';
import { wsBridge } from './ws/bridge';

function startExampleServer(port = 3000) {
  const handlers = {
    ...chatHandlers,
    ...systemHandlers,
    ...timerHandlers,
  } satisfies HandlerMapWithCtx<ClientMessage, HandlerContext>;

  const server = createWSServer(handlers);

  // Initialize the bridge with transport capabilities
  wsBridge.init({
    broadcast: server.broadcast,
    broadcastToRoom: server.broadcastToRoom,
    sendToUser: server.sendToUser,
    rooms: server.rooms,
  });

  const wss = new WebSocketServer({ port });

  wss.on('connection', (socket: WebSocket) => {
    const userId = randomUUID();
    const username = `user-${userId.slice(0, 8)}`;

    server.handleConnection(socket, userId, username);
  });

  console.log(`WebSocket server listening on ws://localhost:${port}`);

  return { wss, server };
}

startExampleServer();
