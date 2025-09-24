import type { MessageUnion } from '../utils/message-helpers';

export type SystemErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export type SystemServerPayloadMap = {
  error: SystemErrorPayload;
};

export const systemServerMessageTypes = ['error'] as const;

export type SystemServerMessageType = keyof SystemServerPayloadMap;

export type SystemServerMessage = MessageUnion<SystemServerPayloadMap>;
