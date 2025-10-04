import type { User } from '../types/db';
import type { MessageUnion } from '../utils/message-helpers';

export type SystemUsersForRoomPayload = {
  roomId: string;
  users: User[];
}

export type SystemServerPayloadMap = {
  'system:users-for-room': SystemUsersForRoomPayload,
};

export type SystemServerMessageType = keyof SystemServerPayloadMap;

export type SystemServerMessage = MessageUnion<SystemServerPayloadMap>;
