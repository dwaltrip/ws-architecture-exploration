import type { MessageUnion } from '../utils/message-helpers';

export type TimerStartPayload = {
  roomId: string;
  durationSeconds: number;
};

export type TimerPausePayload = {
  roomId: string;
};

export type TimerResetPayload = {
  roomId: string;
};

export type TimerResumePayload = {
  roomId: string;
};

export type TimerClientPayloadMap = {
  'timer:start': TimerStartPayload;
  'timer:pause': TimerPausePayload;
  'timer:reset': TimerResetPayload;
  'timer:resume': TimerResumePayload;
};

export type TimerClientMessageType = keyof TimerClientPayloadMap;

export type TimerClientMessage = MessageUnion<TimerClientPayloadMap>;
