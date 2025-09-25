import type { WebSocket } from 'ws';
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
            await handleSystemRoomMessage(message, context);
            return;
          }

          const handler = handlers.get(message.type);

          if (!handler) {
            throw new Error(`Unknown message type: ${String((message as { type?: unknown }).type)}`);
          }

          await handler(message.payload, context);
        } catch (error) {
          console.error('Failed to handle message', error);
          throw error;
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

async function handleSystemRoomMessage(
  message: SystemClientMessage,
  ctx: HandlerContext
) {
  switch (message.type) {
    case 'system:room-join': {
      const { roomId } = message.payload;
      const normalizedRoomId = normalizeRoomId(roomId);
      if (!normalizedRoomId) {
        throw new Error('Room id must be a non-empty string.');
      }

      await ctx.rooms.join(normalizedRoomId);
      return;
    }

    case 'system:room-leave': {
      const { roomId } = message.payload;
      const normalizedRoomId = normalizeRoomId(roomId);
      if (!normalizedRoomId) {
        throw new Error('Room id must be a non-empty string.');
      }

      await ctx.rooms.leave(normalizedRoomId);
      return;
    }

    default:
      const info = String((message as { type?: unknown }).type);
      throw new Error(`Unhandled system room message: ${info}`);
  }
}

function normalizeRoomId(roomId: unknown): string | null {
  if (typeof roomId !== 'string') {
    return null;
  }

  const trimmed = roomId.trim();
  return trimmed.length > 0 ? trimmed : null;
}
