import type { SystemRoomJoinPayload, SystemRoomLeavePayload } from '../../../../common/src';
import { wsBridge } from '../../ws/bridge';
import { SystemMessageBuilders } from './message-builders';

type UserContext = { userId: string };

function normalizeRoomId(roomId: unknown): string | null {
  if (typeof roomId !== 'string') {
    return null;
  }
  const trimmed = roomId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const systemActions = {
  joinRoom(payload: SystemRoomJoinPayload, ctx?: UserContext): void {
    console.log('[systemActions] joinRoom', { payload, ctx });

    const normalizedRoomId = normalizeRoomId(payload.roomId);
    if (!normalizedRoomId) {
      throw new Error('Room id must be a non-empty string.');
    }

    if (!ctx?.userId) {
      throw new Error('User context required for joinRoom');
    }

    console.log(`User ${ctx.userId} joining room ${normalizedRoomId}`);
    wsBridge.rooms.join(normalizedRoomId, ctx.userId);

    const members = wsBridge.rooms.getMembers(normalizedRoomId);
    const userIds = members ? Array.from(members) : [];

    wsBridge.broadcastToRoom(normalizedRoomId, SystemMessageBuilders.usersForRoom({
      roomId: normalizedRoomId,
      users: userIds.map((id) => ({ id, name: 'User ' + id })),
    }));
  },

  leaveRoom(payload: SystemRoomLeavePayload, ctx?: UserContext): void {
    console.log('[systemActions] leaveRoom', { payload, ctx });

    const normalizedRoomId = normalizeRoomId(payload.roomId);
    if (!normalizedRoomId) {
      throw new Error('Room id must be a non-empty string.');
    }

    if (!ctx?.userId) {
      throw new Error('User context required for leaveRoom');
    }

    wsBridge.rooms.leave(normalizedRoomId, ctx.userId);
  },
};
