import type { MessageUnion } from '../utils/message-helpers';

export type ChatMessageBroadcastPayload = {
  id: string;
  text: string;
  userId: string;
  username: string;
  roomId: string;
  timestamp: number;
};

export type ChatTypingBroadcastPayload = {
  roomId: string;
  userIds: string[];
};

export type ChatServerPayloadMap = {
  'chat:message': ChatMessageBroadcastPayload;
  'chat:is-typing-in-room': ChatTypingBroadcastPayload;
};

export type ChatServerMessageType = keyof ChatServerPayloadMap;

export type ChatServerMessage = MessageUnion<ChatServerPayloadMap>;
