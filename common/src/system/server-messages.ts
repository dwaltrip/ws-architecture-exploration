import type { MessageUnion } from '../utils/message-helpers';

export type SystemUsersForRoomPayload = {
  roomId: string;
  userIds: string[];
}

export type SystemServerPayloadMap = {
  'system:users-for-room': SystemUsersForRoomPayload,
};

export const systemServerMessageTypes = [
  'system:users-for-room',
] as const;

export type SystemServerMessageType = keyof SystemServerPayloadMap;

export type SystemServerMessage = MessageUnion<SystemServerPayloadMap>;
