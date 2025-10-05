import type { ClientMessage } from '../../../common/src';
import { createWsRef } from '../ws/create-ws-ref';

type SystemRoomJoinMessage = Extract<ClientMessage, { type: 'system:room-join' }>;
type SystemRoomLeaveMessage = Extract<ClientMessage, { type: 'system:room-leave' }>;

interface SystemWsEffects {
  joinRoom(roomId: string): void;
  leaveRoom(roomId: string): void;
}

const ws = createWsRef('System');

function normalizeRoomId(roomId: string) {
  const trimmed = roomId.trim();
  if (!trimmed) {
    throw new Error('Room id must be a non-empty string');
  }
  return trimmed;
}

const systemWsEffects: SystemWsEffects = {
  joinRoom(roomId: string) {
    const message: SystemRoomJoinMessage = {
      type: 'system:room-join',
      payload: { roomId: normalizeRoomId(roomId) },
    };
    ws.getClient().send(message);
  },

  leaveRoom(roomId: string) {
    const message: SystemRoomLeaveMessage = {
      type: 'system:room-leave',
      payload: { roomId: normalizeRoomId(roomId) },
    };
    ws.getClient().send(message);
  },
};

export { systemWsEffects, ws as systemWs };
