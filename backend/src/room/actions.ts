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
import { ActionError } from '../ws/errors';
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
    const room = await this.roomService.getRoom(payload.roomId);
    if (!room) {
      throw new ActionError('ROOM_NOT_FOUND', `Room ${payload.roomId} does not exist`);
    }

    await this.roomService.addUserToRoom(room.id, ctx.userId, ctx.username);
    const roomInfo = await this.roomService.getRoomInfo(room.id);

    if (!roomInfo) {
      throw new ActionError('ROOM_NOT_FOUND', `Room ${payload.roomId} does not exist`);
    }

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
    if (!(await this.roomService.isUserInRoom(payload.roomId, ctx.userId))) {
      throw new ActionError('NOT_IN_ROOM', 'You are not in this room');
    }

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
