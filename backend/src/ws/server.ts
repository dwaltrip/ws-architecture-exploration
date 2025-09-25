import type { WebSocket } from 'ws';
import { ServerMessages } from './messages';
import type { DomainHandlers, HandlerContext } from './types';
import type {
  ClientMessage,
  ChatClientMessage,
  SystemClientMessage,
} from '../../../common/src';
import { RoomManager } from './room-manager';

export interface WSDomainMap {
  chat: DomainHandlers<ChatClientMessage>;
  // otherDomain: DomainHandlers<SomeOtherDomainClientMessage>;
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
        rooms: {
          join: async (roomId: string) => {
            roomManager.join(roomId, userId);
          },
          leave: async (roomId: string) => {
            roomManager.leave(roomId, userId);
          },
          getMembers: async (roomId: string) => {
            return roomManager.getMembers(roomId);
          },
          isMember: async (roomId: string, targetUserId = userId) => {
            return roomManager.isMember(roomId, targetUserId);
          },
        },

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
          const members = roomManager.requireMembers(roomId);
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

        isInRoom: async (roomId) => roomManager.isMember(roomId, userId),
      };

      socket.on('message', async (raw) => {
        try {
          const message = JSON.parse(raw.toString()) as ClientMessage;

          if (isSystemRoomMessage(message)) {
            handleSystemRoomMessage(message, context);
            return;
          }

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
          try {
            roomManager.leave(roomId, userId);
          } catch (error) {
            console.error(`Failed to remove ${userId} from room ${roomId} on disconnect`, error);
          }
        }
      });
    },
  };
}

function isSystemRoomMessage(message: ClientMessage): message is SystemClientMessage {
  return message.type === 'system:room-join' || message.type === 'system:room-leave';
}

function handleSystemRoomMessage(
  message: SystemClientMessage,
  ctx: HandlerContext
) {
  switch (message.type) {
    case 'system:room-join': {
      const { roomId } = message.payload;
      const normalizedRoomId = normalizeRoomId(roomId);
      if (!normalizedRoomId) {
        ctx.sendError('ROOM_JOIN_INVALID', 'Room id must be a non-empty string.');
        return;
      }

      ctx.rooms.join(normalizedRoomId);
      return;
    }

    case 'system:room-leave': {
      const { roomId } = message.payload;
      const normalizedRoomId = normalizeRoomId(roomId);
      if (!normalizedRoomId) {
        ctx.sendError('ROOM_LEAVE_INVALID', 'Room id must be a non-empty string.');
        return;
      }

      try {
        ctx.rooms.leave(normalizedRoomId);
      } catch (error) {
        ctx.sendError('ROOM_LEAVE_FAILED', error instanceof Error ? error.message : 'Failed to leave room');
      }
      return;
    }

    default:
      ctx.sendError('ROOM_MESSAGE_UNHANDLED', `Unhandled system room message: ${String((message as { type?: unknown }).type)}`);
  }
}

function normalizeRoomId(roomId: unknown): string | null {
  if (typeof roomId !== 'string') {
    return null;
  }

  const trimmed = roomId.trim();
  return trimmed.length > 0 ? trimmed : null;
}
