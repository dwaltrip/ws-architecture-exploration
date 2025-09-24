import type { MessageUnion } from '../utils/message-helpers';

export type RoomJoinPayload = {
  roomId: string;
};

export type RoomLeavePayload = {
  roomId: string;
};

export type RoomListRequestPayload = Record<string, never>;

export type RoomClientPayloadMap = {
  'room:join': RoomJoinPayload;
  'room:leave': RoomLeavePayload;
  'room:list': RoomListRequestPayload;
};

export const roomClientMessageTypes = ['room:join', 'room:leave', 'room:list'] as const;

export type RoomClientMessageType = keyof RoomClientPayloadMap;

export type RoomClientMessage = MessageUnion<RoomClientPayloadMap>;
