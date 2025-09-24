import type { MessageUnion } from '../utils/message-helpers';

export type ChatSendPayload = {
  text: string;
  roomId: string;
};

export type ChatEditPayload = {
  messageId: string;
  newText: string;
};

export type ChatTypingStatePayload = {
  roomId: string;
  isTyping: boolean;
};

export type ChatClientPayloadMap = {
  'chat:send': ChatSendPayload;
  'chat:edit': ChatEditPayload;
  'chat:typing': ChatTypingStatePayload;
};

export const chatClientMessageTypes = ['chat:send', 'chat:edit', 'chat:typing'] as const;

export type ChatClientMessageType = keyof ChatClientPayloadMap;

export type ChatClientMessage = MessageUnion<ChatClientPayloadMap>;
