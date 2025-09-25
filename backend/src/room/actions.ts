import type {
  RoomJoinPayload,
  RoomJoinedPayload,
  RoomLeavePayload,
  RoomLeftPayload,
  RoomListPayload,
  RoomListRequestPayload,
  RoomUserJoinedPayload,
  RoomUserLeftPayload,
} from '../../../common/src';
import type { HandlerContext } from '../ws/types';
import { RoomService } from './service';

export interface JoinRoomResult {
  roomInfo: RoomJoinedPayload;
  joinEvent: RoomUserJoinedPayload;
}

export interface LeaveRoomResult {
  confirmation: RoomLeftPayload;
  leaveEvent: RoomUserLeftPayload;
}

export class RoomActions {
  constructor(private readonly roomService: RoomService) {}

  async joinRoom(
    payload: RoomJoinPayload,
    ctx: HandlerContext
  ): Promise<JoinRoomResult> {
    console.log('[RoomActions] joinRoom', {
      payload,
      userId: ctx.userId,
      username: ctx.username,
    });

    const room = await this.roomService.ensureRoom(payload.roomId, payload.roomId);

    await this.roomService.addUserToRoom(room.id, ctx.userId, ctx.username);
    const roomInfo =
      (await this.roomService.getRoomInfo(room.id)) ?? {
        roomId: room.id,
        name: room.name,
        users: [],
      };

    const joinEvent: RoomUserJoinedPayload = {
      roomId: room.id,
      userId: ctx.userId,
      username: ctx.username,
    };

    return {
      roomInfo,
      joinEvent,
    };
  }

  async leaveRoom(
    payload: RoomLeavePayload,
    ctx: HandlerContext
  ): Promise<LeaveRoomResult> {
    console.log('[RoomActions] leaveRoom', {
      payload,
      userId: ctx.userId,
      username: ctx.username,
    });

    await this.roomService.removeUserFromRoom(payload.roomId, ctx.userId);

    return {
      confirmation: {
        message: `Left room ${payload.roomId}`,
      },
      leaveEvent: {
        roomId: payload.roomId,
        userId: ctx.userId,
        username: ctx.username,
      },
    };
  }

  async listRooms(
    _payload: RoomListRequestPayload,
    _ctx: HandlerContext
  ): Promise<RoomListPayload> {
    console.log('[RoomActions] listRooms');

    const rooms = await this.roomService.listRooms();

    return {
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        userCount: room.users.length,
      })),
    };
  }
}
