import type { MessageUnion } from '../utils/message-helpers';

export type GamePlayer = {
  userId: string;
  username: string;
  x: number;
  y: number;
  color: string;
};

export type GameStatePayload = {
  players: GamePlayer[];
};

export type GameServerPayloadMap = {
  'game:state': GameStatePayload;
};

export type GameServerMessageType = keyof GameServerPayloadMap;

export type GameServerMessage = MessageUnion<GameServerPayloadMap>;
