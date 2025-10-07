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

export const gameClientMessageTypes = [
  'game:join',
  'game:move',
  'game:leave',
] as const;

export type GameClientMessageType = keyof GameClientPayloadMap;

export type GameClientMessage = MessageUnion<GameClientPayloadMap>;
