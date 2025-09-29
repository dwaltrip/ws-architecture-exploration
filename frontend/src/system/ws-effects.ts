import type { ClientMessage } from '../../../common/src';

import { getWsClient } from '../ws/create-client';

type SystemRoomJoinMessage = Extract<ClientMessage, { type: 'system:room-join' }>;
type SystemRoomLeaveMessage = Extract<ClientMessage, { type: 'system:room-leave' }>;

interface SystemWsEffects {
  joinRoom(roomId: string): void;
  leaveRoom(roomId: string): void;
}

function normalizeRoomId(roomId: string) {
  const trimmed = roomId.trim();
  if (!trimmed) {
    throw new Error('Room id must be a non-empty string');
  }

  return trimmed;
}

function createSystemWsEffects(): SystemWsEffects {
  return {
    joinRoom(roomId: string) {
      const message: SystemRoomJoinMessage = {
        type: 'system:room-join',
        payload: { roomId: normalizeRoomId(roomId) },
      };

      getWsClient().send(message);
    },
    leaveRoom(roomId: string) {
      const message: SystemRoomLeaveMessage = {
        type: 'system:room-leave',
        payload: { roomId: normalizeRoomId(roomId) },
      };

      getWsClient().send(message);
    },
  } as const;
}

const systemWsEffects = createSystemWsEffects();

export type { SystemWsEffects };
export { createSystemWsEffects, systemWsEffects };
