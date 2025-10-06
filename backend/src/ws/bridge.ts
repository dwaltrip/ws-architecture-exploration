import type { ServerMessage } from '../../../common/src';

type BroadcastOptions = { excludeUserId?: string };

interface RoomMembershipAdapter {
  join(roomId: string, userId: string): void;
  leave(roomId: string, userId: string): void;
  getMembers(roomId: string): Set<string> | null;
  isMember(roomId: string, userId: string): boolean;
}

interface WsTransport {
  broadcast(message: ServerMessage, opts?: BroadcastOptions): void;
  broadcastToRoom(roomId: string, message: ServerMessage, opts?: BroadcastOptions): void;
  sendToUser(userId: string, message: ServerMessage): void;
  rooms: RoomMembershipAdapter;
}

let transport: WsTransport | null = null;

export const wsBridge = {
  init(impl: WsTransport) {
    transport = impl;
  },
  get(): WsTransport {
    if (!transport) {
      throw new Error('WS bridge not initialized');
    }
    return transport;
  },
};

export type { BroadcastOptions, RoomMembershipAdapter, WsTransport };
