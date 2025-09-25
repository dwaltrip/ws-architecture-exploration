import type {
  ChatMessageBroadcastPayload,
  ChatMessageEditedPayload,
  ChatServerMessage,
  ChatTypingBroadcastPayload,
  ServerMessage,
  SystemErrorPayload,
} from '../../../common/src';

export const ServerMessages = {
  chat: {
    message: (
      payload: ChatMessageBroadcastPayload
    ): Extract<ChatServerMessage, { type: 'chat:message' }> => ({
      type: 'chat:message',
      payload,
    }),
    edited: (
      payload: ChatMessageEditedPayload
    ): Extract<ChatServerMessage, { type: 'chat:edited' }> => ({
      type: 'chat:edited',
      payload,
    }),
    typing: (
      payload: ChatTypingBroadcastPayload
    ): Extract<ChatServerMessage, { type: 'chat:typing' }> => ({
      type: 'chat:typing',
      payload,
    }),
  },
  system: {
    error: (
      payload: SystemErrorPayload
    ): Extract<ServerMessage, { type: 'error' }> => ({
      type: 'error',
      payload,
    }),
  },
};
