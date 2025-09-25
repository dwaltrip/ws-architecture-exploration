
// This not super efficient / robust, but just for demo purposes
// We are focusing on the WebSocket architecture, this is tangential
// and the implementation shouldn't have much impact on the core architecture much.
// So no need to spend too much time here.
class RoomManager {
  private rooms = new Map<string, Set<string>>();

  join(roomId: string, userId: string) {
    const members = this.rooms.get(roomId) ?? new Set<string>();
    const wasExistingRoom = this.rooms.has(roomId);
    if (!wasExistingRoom) {
      this.rooms.set(roomId, members);
    }

    const alreadyMember = members.has(userId);
    members.add(userId);

    return {
      createdRoom: !wasExistingRoom,
      alreadyMember,
    };
  }

  leave(roomId: string, userId: string) {
    const members = this.rooms.get(roomId);
    if (!members) {
      throw new Error(`Room ${roomId} does not exist`);
    }
    if (!members.has(userId)) {
      throw new Error(`User ${userId} is not in room ${roomId}`);
    }

    members.delete(userId);
    if (members.size === 0) {
      this.rooms.delete(roomId);
    }

    return { roomRemoved: !this.rooms.has(roomId) };
  }

  getMembers(roomId: string): Set<string> | null {
    const members = this.rooms.get(roomId);
    return members ? new Set(members) : null;
  }

  requireMembers(roomId: string): Set<string> {
    const members = this.rooms.get(roomId);
    if (!members) {
      throw new Error(`Room ${roomId} does not exist`);
    }
    return members;
  }

  isMember(roomId: string, userId: string): boolean {
    return this.rooms.get(roomId)?.has(userId) ?? false;
  }

  getRoomsForUser(userId: string): string[] {
    const roomsForUser: string[] = [];
    for (const [roomId, users] of this.rooms.entries()) {
      if (users.has(userId)) {
        roomsForUser.push(roomId);
      }
    }
    return roomsForUser;
  }
}

export { RoomManager };
