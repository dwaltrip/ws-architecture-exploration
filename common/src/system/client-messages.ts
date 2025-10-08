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

export type SystemClientMessageType = keyof SystemClientPayloadMap;

export type SystemClientMessage = MessageUnion<SystemClientPayloadMap>;
