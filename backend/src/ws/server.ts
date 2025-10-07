import { randomUUID } from 'crypto';
import { WebSocketServer, type WebSocket } from 'ws';

import type { HandlerContext } from './types';
import type { ClientMessage, ServerMessage } from '../../../common/src';
import type { HandlerMapWithCtx } from '../../../common/src/utils/message-helpers';
import type { BroadcastOptions, RoomMembershipAdapter } from './bridge';
import { RoomManager } from './room-manager';

type GenericHandler = (payload: unknown, ctx: HandlerContext) => void;

function generateUser() {
  const userId = randomUUID().slice(0, 12);
  const username = `User ${userId.slice(0, 8)}`;
  return { userId, username };
}

export function createWSServer(
  port: number,
  handlers: HandlerMapWithCtx<ClientMessage, HandlerContext>,
) {
  const handlerMap = new Map<string, GenericHandler>();

  Object.entries(handlers).forEach(([type, handler]) => {
    handlerMap.set(type, handler as GenericHandler);
  });

  const clients = new Map<string, WebSocket>();
  const roomManager = new RoomManager();

  const rooms: RoomMembershipAdapter = {
    join: (roomId: string, userId: string) => {
      roomManager.join(roomId, userId);
    },
    leave: (roomId: string, userId: string) => {
      roomManager.leave(roomId, userId);
    },
    getMembers: (roomId: string) => {
      return roomManager.getMembers(roomId);
    },
    isMember: (roomId: string, userId: string) => {
      return roomManager.isMember(roomId, userId);
    },
  };

  function broadcast(message: ServerMessage, opts?: BroadcastOptions): void {
    const data = JSON.stringify(message);
    for (const [id, ws] of clients.entries()) {
      if (!opts?.excludeUserId || id !== opts.excludeUserId) {
        ws.send(data);
      }
    }
  }

  function broadcastToRoom(roomId: string, message: ServerMessage, opts?: BroadcastOptions): void {
    const members = roomManager.requireMembers(roomId);
    const data = JSON.stringify(message);
    for (const memberId of members) {
      if (!opts?.excludeUserId || memberId !== opts.excludeUserId) {
        clients.get(memberId)?.send(data);
      }
    }
  }

  function sendToUser(userId: string, message: ServerMessage): void {
    const socket = clients.get(userId);
    if (socket) {
      socket.send(JSON.stringify(message));
    }
  }

  function handleConnection(socket: WebSocket, userId: string, username: string) {
    clients.set(userId, socket);
    console.log(`Client connected -- ${userId}`);

    const context: HandlerContext = {
      userId,
      username,
    };

    socket.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as ClientMessage;

        const handler = handlerMap.get(message.type);

        if (!handler) {
          throw new Error(`Unknown message type: ${String((message as { type?: unknown }).type)}`);
        }

        handler(message.payload, context);
      } catch (error) {
        console.error('Failed to handle message', error);
        throw error;
      }
    });

    socket.on('close', () => {
      clients.delete(userId);
      const userRooms = roomManager.getRoomsForUser(userId);

      for (const roomId of userRooms) {
        try {
          roomManager.leave(roomId, userId);
        } catch (error) {
          console.error(`Failed to remove ${userId} from room ${roomId} on disconnect`, error);
        }
      }
      console.log(`Client disconnected -- ${userId}`);
    });
  }

  const wss = new WebSocketServer({ port });
  console.log(`WebSocket server listening on ws://localhost:${port}`);

  wss.on('connection', (socket: WebSocket) => {
    const { userId, username } = generateUser();
    handleConnection(socket, userId, username);
  });

  return {
    broadcast,
    broadcastToRoom,
    sendToUser,
    rooms,
  };
}
