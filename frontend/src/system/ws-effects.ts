import type { ClientMessage, ServerMessage } from '../../../common/src';
import type { WSClient } from '../ws/client';

type SystemWsClient = WSClient<ServerMessage, ClientMessage>;

type SystemRoomJoinMessage = Extract<ClientMessage, { type: 'system:room-join' }>;
type SystemRoomLeaveMessage = Extract<ClientMessage, { type: 'system:room-leave' }>;

function normalizeRoomId(roomId: string) {
  const trimmed = roomId.trim();
  if (!trimmed) {
    throw new Error('Room id must be a non-empty string');
  }

  return trimmed;
}

function createSystemWsEffects(client: SystemWsClient) {
  return {
    joinRoom(roomId: string) {
      const message: SystemRoomJoinMessage = {
        type: 'system:room-join',
        payload: { roomId: normalizeRoomId(roomId) },
      };

      client.send(message);
    },
    leaveRoom(roomId: string) {
      const message: SystemRoomLeaveMessage = {
        type: 'system:room-leave',
        payload: { roomId: normalizeRoomId(roomId) },
      };

      client.send(message);
    },
  } as const;
}

export { createSystemWsEffects };
