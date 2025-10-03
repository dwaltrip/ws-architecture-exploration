import type { MessageUnion } from '../utils/message-helpers';

export type ChatMessageBroadcastPayload = {
  id: string;
  text: string;
  userId: string;
  username: string;
  roomId: string;
  timestamp: number;
};

export type ChatMessageEditedPayload = {
  messageId: string;
  newText: string;
  editedBy: string;
};

export type ChatTypingBroadcastPayload = {
  roomId: string;
  userId: string;
  username: string;
  isTyping: boolean;
};

export type ChatServerPayloadMap = {
  'chat:message': ChatMessageBroadcastPayload;
  'chat:edited': ChatMessageEditedPayload;
  'chat:typing': ChatTypingBroadcastPayload;
};

export const chatServerMessageTypes = [
  'chat:message',
  'chat:edited',
  'chat:typing',
] as const;

export type ChatServerMessageType = keyof ChatServerPayloadMap;

export type ChatServerMessage = MessageUnion<ChatServerPayloadMap>;
