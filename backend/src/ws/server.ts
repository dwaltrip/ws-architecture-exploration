import type { WebSocket } from 'ws';
import { ServerMessages } from './messages';
import type { DomainHandlers, HandlerContext } from './types';
import type { ClientMessage } from '../../../common/src';
import type { ChatClientMessage } from '../../../common/src';
import { RoomManager } from './room-manager';
// import type { RoomClientMessage } from '../../../common/src';
// import type { RoomService } from '../room/service';

export interface WSDomainMap {
  chat: DomainHandlers<ChatClientMessage>;
  // room: DomainHandlers<RoomClientMessage>;
}

type GenericHandler = (payload: unknown, ctx: HandlerContext) => void | Promise<void>;

export function createWSServer(domains: WSDomainMap) {
  const handlers = new Map<string, GenericHandler>();

  Object.values(domains).forEach((domainHandlers) => {
    Object.entries(domainHandlers).forEach(([type, handler]) => {
      handlers.set(type, handler as GenericHandler);
    });
  });

  const clients = new Map<string, WebSocket>();
  const roomManager = new RoomManager();

  return {
    handleConnection(socket: WebSocket, userId: string, username: string) {
      clients.set(userId, socket);

      const context: HandlerContext = {
        userId,
        username,

        send: (message) => {
          socket.send(JSON.stringify(message));
        },

        sendError: (code, message, details) => {
          socket.send(JSON.stringify(ServerMessages.system.error({ code, message, details })));
        },

        broadcast: (message, excludeSelf) => {
          const data = JSON.stringify(message);
          for (const [id, ws] of clients.entries()) {
            if (!excludeSelf || id !== userId) {
              ws.send(data);
            }
          }
        },

        broadcastToRoom: async (roomId, message, excludeSelf) => {
          const members = roomManager.getUsersInRoom(roomId);
          const data = JSON.stringify(message);
          const promises = Array.from(members).map((memberId) => {
            return (!excludeSelf || memberId !== userId) ?
              clients.get(memberId)?.send(data) :
              Promise.resolve();
          });
          return Promise.all(promises)
            .then(() => undefined)
            .catch((err) => {
              console.error('Broadcast to room failed', err);
              throw err;
            });
        },

        isInRoom: async (roomId) => roomManager.getUsersInRoom(roomId).has(userId),
      };

      socket.on('message', async (raw) => {
        try {
          const message = JSON.parse(raw.toString()) as ClientMessage;
          const handler = handlers.get(message.type);

          if (!handler) {
            context.sendError('UNKNOWN_MESSAGE_TYPE', `Unknown message type: ${String((message as { type?: unknown }).type)}`);
            return;
          }

          await handler(message.payload, context);
        } catch (error) {
          console.error('Failed to handle message', error);
          context.sendError(
            'HANDLER_ERROR',
            error instanceof Error ? error.message : 'An unexpected error occurred'
          );
        }
      });

      socket.on('close', async () => {
        clients.delete(userId);
        const rooms = roomManager.getRoomsForUser(userId);

        for (const roomId of rooms) {
          roomManager.removeUserFromRoom(roomId, userId);
          await context.broadcastToRoom(
            roomId,
            ServerMessages.room.userLeft({ roomId, userId, username }),
            true
          );
        }
      });
    },
  };
}
