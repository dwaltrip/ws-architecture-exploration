import type { RoomJoinedPayload, RoomMemberSnapshot } from '../../../common/src';

interface RoomState {
  id: string;
  name: string;
  users: Map<string, RoomMemberSnapshot>;
}

export class RoomService {
  private rooms = new Map<string, RoomState>();
  private userRooms = new Map<string, Set<string>>();

  constructor() {
    this.ensureRoom('lobby', 'Lobby');
  }

  async getRoom(roomId: string): Promise<RoomState | undefined> {
    return this.rooms.get(roomId);
  }

  async ensureRoom(roomId: string, name: string): Promise<RoomState> {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        name,
        users: new Map(),
      };
      this.rooms.set(roomId, room);
    }

    return room;
  }

  async addUserToRoom(roomId: string, userId: string, username: string): Promise<RoomMemberSnapshot> {
    const room = await this.getRoom(roomId);

    if (!room) {
      throw new Error(`Room ${roomId} does not exist`);
    }

    const existing = room.users.get(userId);
    if (existing) {
      return existing;
    }

    const snapshot: RoomMemberSnapshot = {
      id: userId,
      username,
      joinedAt: Date.now(),
    };

    room.users.set(userId, snapshot);
    this.getOrCreateUserRooms(userId).add(roomId);

    return snapshot;
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) {
      return;
    }

    room.users.delete(userId);
    const rooms = this.userRooms.get(userId);
    rooms?.delete(roomId);
    if (rooms && rooms.size === 0) {
      this.userRooms.delete(userId);
    }
  }

  async getRoomInfo(roomId: string): Promise<RoomJoinedPayload | undefined> {
    const room = await this.getRoom(roomId);
    if (!room) {
      return undefined;
    }

    return {
      roomId: room.id,
      name: room.name,
      users: Array.from(room.users.values()),
    };
  }

  async getRoomUsers(roomId: string): Promise<RoomMemberSnapshot[]> {
    const room = await this.getRoom(roomId);
    if (!room) {
      return [];
    }

    return Array.from(room.users.values());
  }

  async listRooms(): Promise<Array<{ id: string; name: string; users: RoomMemberSnapshot[] }>> {
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      name: room.name,
      users: Array.from(room.users.values()),
    }));
  }

  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    return room?.users.has(userId) ?? false;
  }

  async getRoomsForUser(userId: string): Promise<string[]> {
    return Array.from(this.userRooms.get(userId) ?? []);
  }

  private getOrCreateUserRooms(userId: string): Set<string> {
    let rooms = this.userRooms.get(userId);
    if (!rooms) {
      rooms = new Set();
      this.userRooms.set(userId, rooms);
    }

    return rooms;
  }
}
