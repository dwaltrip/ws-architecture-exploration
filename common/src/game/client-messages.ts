import type { MessageUnion } from '../utils/message-helpers';

export type GameJoinPayload = Record<string, never>;

export type GameMovePayload = {
  x: number;
  y: number;
};

export type GameLeavePayload = Record<string, never>;

export type GameClientPayloadMap = {
  'game:join': GameJoinPayload;
  'game:move': GameMovePayload;
  'game:leave': GameLeavePayload;
};

export type GameClientMessageType = keyof GameClientPayloadMap;

export type GameClientMessage = MessageUnion<GameClientPayloadMap>;
