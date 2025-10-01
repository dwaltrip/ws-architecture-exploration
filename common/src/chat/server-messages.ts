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

export type ChatUsersInRoomUpdatePayload = {
  roomId: string;
  userIds: string[];
}

export type ChatServerPayloadMap = {
  'chat:message': ChatMessageBroadcastPayload;
  'chat:edited': ChatMessageEditedPayload;
  'chat:typing': ChatTypingBroadcastPayload;
  'chat:users-in-room-update': ChatUsersInRoomUpdatePayload;
};

export const chatServerMessageTypes = [
  'chat:message',
  'chat:edited',
  'chat:typing',
  'chat:users-in-room-update',
] as const;

export type ChatServerMessageType = keyof ChatServerPayloadMap;

export type ChatServerMessage = MessageUnion<ChatServerPayloadMap>;
