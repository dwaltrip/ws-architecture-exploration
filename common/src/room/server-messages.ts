import { MessageUnion } from '../utils/message-helpers';

export type RoomMemberSnapshot = {
  id: string;
  username: string;
  joinedAt: number;
};

export type RoomJoinedPayload = {
  roomId: string;
  name: string;
  users: RoomMemberSnapshot[];
};

export type RoomLeftPayload = {
  message: string;
};

export type RoomSummary = {
  id: string;
  name: string;
  userCount: number;
};

export type RoomListPayload = {
  rooms: RoomSummary[];
};

export type RoomUserJoinedPayload = {
  roomId: string;
  userId: string;
  username: string;
};

export type RoomUserLeftPayload = {
  roomId: string;
  userId: string;
  username: string;
};

export type RoomServerPayloadMap = {
  'room:joined': RoomJoinedPayload;
  'room:left': RoomLeftPayload;
  'room:list': RoomListPayload;
  'room:user_joined': RoomUserJoinedPayload;
  'room:user_left': RoomUserLeftPayload;
};

export const roomServerMessageTypes = [
  'room:joined',
  'room:left',
  'room:list',
  'room:user_joined',
  'room:user_left',
] as const;

export type RoomServerMessageType = keyof RoomServerPayloadMap;

export type RoomServerMessage = MessageUnion<RoomServerPayloadMap>;
