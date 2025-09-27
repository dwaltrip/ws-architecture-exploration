import { useMemo } from 'react';
import type { ClientMessage } from '../../../common/src';

import type { AppWsClient } from '../ws/types';
import { getOrCreateWsClient } from '../ws/create-client';

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

function createSystemWsEffects(client: AppWsClient) {
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

const getSystemWsEffects = (() => {
  let effects: SystemWsEffects | null = null;
  return function(client: AppWsClient): SystemWsEffects {
    if (!effects) {
      effects = createSystemWsEffects(client);
    }
    return effects;
  };
})();

function useSystemWsEffects() {
  return useMemo(() => {
    console.log('Creating chat WS effects');
    const client = getOrCreateWsClient();
    return createSystemWsEffects(client);
  }, []);
}

export type { SystemWsEffects };
export { createSystemWsEffects, useSystemWsEffects, getSystemWsEffects};
