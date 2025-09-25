import type { MessageUnion } from '../utils/message-helpers';

export type SystemRoomJoinPayload = {
  roomId: string;
};

export type SystemRoomLeavePayload = {
  roomId: string;
};

export type SystemClientPayloadMap = {
  'system:room-join': SystemRoomJoinPayload;
  'system:room-leave': SystemRoomLeavePayload;
};

export const systemClientMessageTypes = [
  'system:room-join',
  'system:room-leave',
] as const;

export type SystemClientMessageType = keyof SystemClientPayloadMap;

export type SystemClientMessage = MessageUnion<SystemClientPayloadMap>;
