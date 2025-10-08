import { User } from "../../../../common/src";
import { wsBridge } from "../../ws/bridge";
import { normalizeRoomId } from "./utils";

const systemWsEffects = {
  broadcastUsersForRoom(roomId: string, users: User[]): void {
    const normalizedRoomId = normalizeRoomId(roomId);
    if (!normalizedRoomId) {
      throw new Error('Room id must be a non-empty string.');
    }
    wsBridge.broadcastToRoom(normalizedRoomId, {
      type: 'system:users-for-room',
      payload: { roomId: normalizedRoomId, users },
    });
  }
}

export { systemWsEffects };
