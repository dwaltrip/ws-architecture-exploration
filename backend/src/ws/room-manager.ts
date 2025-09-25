
// This not super efficient / robust, but just for demo purposes
// We are focusing on the WebSocket architecture, this is tangential
// and the implementation shouldn't have much impact on the core architecture much.
// So no need to spend too much time here.
class RoomManager {
  private rooms: Map<string, Set<string>> = new Map();

  addUserToRoom(roomId: string, userId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(userId);
  }

  removeUserFromRoom(roomId: string, userId: string) {
    this.rooms.get(roomId)?.delete(userId);
  }

  getUsersInRoom(roomId: string): Set<string> {
    const usersInRoom = this.rooms.get(roomId);
    if (!usersInRoom) {
      throw new Error(`Room ${roomId} does not exist`);
    }
    return usersInRoom;
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
