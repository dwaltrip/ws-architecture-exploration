import { randomUUID } from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { ChatActions, ChatService, createChatHandlers } from './chat';
import { createWSServer } from './ws';

function startExampleServer(port = 3000) {
  const chatService = new ChatService();
  const chatActions = new ChatActions(chatService);

  // const someOtherDomainService = new SomeOtherDomainService();
  // const someOtherDomainActions = new SomeOtherDomainActions(someOtherDomainService);

  const server = createWSServer(
    {
      chat: createChatHandlers(chatActions),
      // someOtherDomain: createSomeOtherDomainHandlers(someOtherDomainActions),
    },
  );

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
