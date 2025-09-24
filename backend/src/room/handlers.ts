import type { RoomClientMessage } from '../../../common/src';
import { RoomActions } from './actions';
import { ActionError } from '../ws/errors';
import { ServerMessages } from '../ws/messages';
import type { DomainHandlers } from '../ws/types';

export function createRoomHandlers(actions: RoomActions): DomainHandlers<RoomClientMessage> {
  return {
    'room:join': async (payload, ctx) => {
      try {
        const result = await actions.joinRoom(payload, ctx);
        ctx.send(ServerMessages.room.joined(result.roomInfo));
        await ctx.broadcastToRoom(
          result.roomInfo.roomId,
          ServerMessages.room.userJoined(result.joinEvent),
          true
        );
      } catch (error) {
        handleActionError(error, ctx);
      }
    },
    'room:leave': async (payload, ctx) => {
      try {
        const result = await actions.leaveRoom(payload, ctx);
        ctx.send(ServerMessages.room.left(result.confirmation));
        await ctx.broadcastToRoom(
          result.leaveEvent.roomId,
          ServerMessages.room.userLeft(result.leaveEvent)
        );
      } catch (error) {
        handleActionError(error, ctx);
      }
    },
    'room:list': async (payload, ctx) => {
      try {
        const list = await actions.listRooms(payload, ctx);
        ctx.send(ServerMessages.room.list(list));
      } catch (error) {
        handleActionError(error, ctx);
      }
    },
  };
}

function handleActionError(error: unknown, ctx: { sendError: (code: string, message: string) => void }) {
  if (error instanceof ActionError) {
    ctx.sendError(error.code, error.message);
    return;
  }

  throw error;
}
