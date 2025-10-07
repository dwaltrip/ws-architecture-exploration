import type { SystemRoomJoinPayload, SystemRoomLeavePayload } from '../../../../common/src';
import { wsBridge } from '../../ws/bridge';
import { SystemMessageBuilders } from './message-builders';
import * as userStore from '../../db/user-store.js';
import { generateUsername } from '../../utils/username-generator.js';

type UserContext = { userId: string };

function normalizeRoomId(roomId: unknown): string | null {
  if (typeof roomId !== 'string') {
    return null;
  }
  const trimmed = roomId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function createUser(): { userId: string; username: string } {
  const userId = userStore.generateUserId();
  const username = generateUsername();
  userStore.addUser(userId, username);
  return { userId, username };
}

export function removeUser(userId: string): void {
  userStore.removeUser(userId);
}

export function getUser(userId: string) {
  return userStore.getUser(userId);
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
      users: userIds.map((id) => {
        const user = userStore.getUser(id);
        return { id, username: user?.username ?? 'Unknown User' };
      }),
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
