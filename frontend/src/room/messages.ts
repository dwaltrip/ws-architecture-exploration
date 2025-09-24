import type { RoomClientMessage } from '../../../common/src';

export const roomMessages = {
  join: (
    roomId: string
  ): Extract<RoomClientMessage, { type: 'room:join' }> => ({
    type: 'room:join',
    payload: { roomId },
  }),
  leave: (
    roomId: string
  ): Extract<RoomClientMessage, { type: 'room:leave' }> => ({
    type: 'room:leave',
    payload: { roomId },
  }),
  list: (): Extract<RoomClientMessage, { type: 'room:list' }> => ({
    type: 'room:list',
    payload: {},
  }),
} as const;
