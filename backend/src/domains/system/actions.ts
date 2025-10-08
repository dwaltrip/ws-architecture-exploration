import type { SystemRoomJoinPayload, SystemRoomLeavePayload } from '../../../../common/src';
import { wsBridge } from '../../ws/bridge';
import * as userStore from '../../db/user-store.js';
import { generateUsername } from '../../utils/username-generator.js';
import { systemWsEffects } from './ws-effects';
import { normalizeRoomId } from './utils';

type UserContext = { userId: string };

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

function validateRoomId(roomId: unknown): string {
  const normalizedRoomId = normalizeRoomId(roomId);
  if (!normalizedRoomId) {
    throw new Error('Room id must be a non-empty string.');
  }
  return normalizedRoomId;
}

export const systemActions = {
  joinRoom(payload: SystemRoomJoinPayload, ctx: UserContext): void {
    const normalizedRoomId = validateRoomId(payload.roomId);
    wsBridge.rooms.join(normalizedRoomId, ctx.userId);
    console.log(`[SystemActions] User ${ctx.userId} joined room ${normalizedRoomId}`);

    const members = wsBridge.rooms.getMembers(normalizedRoomId);
    const userIds = members ? Array.from(members) : [];
    const users = userIds.map((id) => {
      const user = userStore.getUser(id);
      return { id, username: user?.username ?? 'Unknown User' };
    });
    systemWsEffects.broadcastUsersForRoom(normalizedRoomId, users);
  },

  leaveRoom(payload: SystemRoomLeavePayload, ctx: UserContext): void {
    const normalizedRoomId = validateRoomId(payload.roomId);
    wsBridge.rooms.leave(normalizedRoomId, ctx.userId);
    console.log(`[SystemActions] User ${ctx.userId} left room ${normalizedRoomId}`);
  },
};
