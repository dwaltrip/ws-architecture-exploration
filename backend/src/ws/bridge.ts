import type { ServerMessage } from '../../../common/src';

export type BroadcastOptions = { excludeUserId?: string };

export interface RoomMembershipAdapter {
  join(roomId: string, userId: string): void;
  leave(roomId: string, userId: string): void;
  getMembers(roomId: string): Set<string> | null;
  isMember(roomId: string, userId: string): boolean;
}

export interface WsTransport<TMessage extends { type: string; payload: unknown }> {
  broadcast(message: TMessage, opts?: BroadcastOptions): void;
  broadcastToRoom(roomId: string, message: TMessage, opts?: BroadcastOptions): void;
  sendToUser(userId: string, message: TMessage): void;
  rooms: RoomMembershipAdapter;
}

function createWsBridge<TMessage extends { type: string; payload: unknown }>() {
  let transport: WsTransport<TMessage> | null = null;

  function requireTransport(): WsTransport<TMessage> {
    if (!transport) {
      throw new Error('WS bridge not initialized');
    }
    return transport;
  }

  return {
    init(impl: WsTransport<TMessage>) {
      transport = impl;
    },
    broadcast(message: TMessage, opts?: BroadcastOptions) {
      requireTransport().broadcast(message, opts);
    },
    broadcastToRoom(roomId: string, message: TMessage, opts?: BroadcastOptions) {
      requireTransport().broadcastToRoom(roomId, message, opts);
    },
    sendToUser(userId: string, message: TMessage) {
      requireTransport().sendToUser(userId, message);
    },
    get rooms(): RoomMembershipAdapter {
      return requireTransport().rooms;
    },
  };
}

export const wsBridge = createWsBridge<ServerMessage>();

export { createWsBridge };
