import type { MessageUnion } from '../utils/message-helpers';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

// NOTE: this duplicates TimerState (mostly)
export type TimerStateChangedPayload = {
  roomId: string;
  status: TimerStatus;
  remainingSeconds: number;
  totalDurationSeconds: number;
};

export type TimerServerPayloadMap = {
  'timer:state-changed': TimerStateChangedPayload;
};

export type TimerServerMessageType = keyof TimerServerPayloadMap;

export type TimerServerMessage = MessageUnion<TimerServerPayloadMap>;
