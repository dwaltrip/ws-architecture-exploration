import { WebSocketServer, type WebSocket } from 'ws';

import { UserId } from '../../../common/src';
import type {
  HandlerMapWithCtx,
  MessageType,
  PayloadFor,
} from '../../../common/src/utils/message-helpers';
import type { BroadcastOptions, RoomMembershipAdapter } from './bridge';
import { RoomManager } from './room-manager';

export interface WSServerConfig<
  TIncoming extends { type: string; payload: unknown },
  TOutgoing extends { type: string; payload: unknown },
  TContext
> {
  port: number;
  handlers: HandlerMapWithCtx<TIncoming, TContext>;
  onConnection?(socket: WebSocket): UserId;
  createContext(userId: UserId): TContext;
  getUserId(context: TContext): string;
  onDisconnect?(userId: UserId): void;
  encode?(message: TOutgoing): string;
  decode?(raw: string): TIncoming;
}

export interface WSServerTransport<
  TOutgoing extends { type: string; payload: unknown }
> {
  broadcast(message: TOutgoing, opts?: BroadcastOptions): void;
  broadcastToRoom(roomId: string, message: TOutgoing, opts?: BroadcastOptions): void;
  sendToUser(userId: string, message: TOutgoing): void;
}

export interface WSServerInstance<
  TOutgoing extends { type: string; payload: unknown }
> extends WSServerTransport<TOutgoing> {
  rooms: RoomMembershipAdapter;
}

export function createWSServer<
  TIncoming extends { type: string; payload: unknown },
  TOutgoing extends { type: string; payload: unknown },
  TContext
>(config: WSServerConfig<TIncoming, TOutgoing, TContext>): WSServerInstance<TOutgoing> {
  const {
    port,
    handlers,
    onConnection,
    createContext,
    getUserId,
    onDisconnect,
    encode = (message) => JSON.stringify(message),
    decode = (raw) => JSON.parse(raw) as TIncoming,
  } = config;

  function getHandler<TType extends MessageType<TIncoming>>(
    type: TType,
  ): (payload: PayloadFor<TIncoming, TType>, ctx: TContext) => void {
    return handlers[type];
  }

  const clients = new Map<UserId, WebSocket>();
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

  function broadcast(message: TOutgoing, opts?: BroadcastOptions): void {
    const data = encode(message);
    for (const [id, ws] of clients.entries()) {
      if (!opts?.excludeUserId || id !== opts.excludeUserId) {
        ws.send(data);
      }
    }
  }

  function broadcastToRoom(roomId: string, message: TOutgoing, opts?: BroadcastOptions): void {
    const members = roomManager.requireMembers(roomId);
    const data = encode(message);
    for (const memberId of members) {
      if (!opts?.excludeUserId || memberId !== opts.excludeUserId) {
        clients.get(memberId)?.send(data);
      }
    }
  }

  function sendToUser(userId: string, message: TOutgoing): void {
    const socket = clients.get(userId);
    if (socket) {
      socket.send(encode(message));
    }
  }

  const wss = new WebSocketServer({ port });
  console.log(`WebSocket server listening on ws://localhost:${port}`);

  wss.on('connection', (socket: WebSocket) => {
    const userId = onConnection ? onConnection(socket) : '';
    const context = createContext(userId);

    clients.set(userId, socket);

    socket.on('message', (raw) => {
      try {
        const message = decode(raw.toString());
        const handler = getHandler(message.type);

        if (!handler) {
          throw new Error(`Unknown message type: ${String((message as { type?: unknown }).type)}`);
        }

        handler(message.payload, context);
      } catch (error) {
        console.error('Failed to handle message', error);
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

      if (onDisconnect) {
        onDisconnect(userId);
      }

      console.log(`Client disconnected -- ${userId}`);
    });
  });

  return {
    broadcast,
    broadcastToRoom,
    sendToUser,
    rooms,
  };
}
