import type { AppWsClient } from '../ws/types';
import type { ClientMessage } from '../../../common/src';

type SystemRoomJoinMessage = Extract<ClientMessage, { type: 'system:room-join' }>;
type SystemRoomLeaveMessage = Extract<ClientMessage, { type: 'system:room-leave' }>;

interface SystemWsEffects {
  joinRoom(roomId: string): void;
  leaveRoom(roomId: string): void;
}

let _client: AppWsClient | null = null;

export function initSystemWsEffects(client: AppWsClient): void {
  _client = client;
}

export function resetSystemWsEffectsForTests(): void {
  _client = null;
}

function normalizeRoomId(roomId: string) {
  const trimmed = roomId.trim();
  if (!trimmed) {
    throw new Error('Room id must be a non-empty string');
  }
  return trimmed;
}

export const systemWsEffects: SystemWsEffects = {
  joinRoom(roomId: string) {
    if (!_client) {
      throw new Error('System WS effects not initialized');
    }
    const message: SystemRoomJoinMessage = {
      type: 'system:room-join',
      payload: { roomId: normalizeRoomId(roomId) },
    };
    _client.send(message);
  },

  leaveRoom(roomId: string) {
    if (!_client) {
      throw new Error('System WS effects not initialized');
    }
    const message: SystemRoomLeaveMessage = {
      type: 'system:room-leave',
      payload: { roomId: normalizeRoomId(roomId) },
    };
    _client.send(message);
  },
};

export type { SystemWsEffects };
