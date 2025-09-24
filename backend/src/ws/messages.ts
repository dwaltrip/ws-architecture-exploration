import type {
  ChatMessageBroadcastPayload,
  ChatMessageEditedPayload,
  ChatServerMessage,
  ChatTypingBroadcastPayload,
  RoomJoinedPayload,
  RoomLeftPayload,
  RoomListPayload,
  RoomServerMessage,
  RoomUserJoinedPayload,
  RoomUserLeftPayload,
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
  room: {
    joined: (
      payload: RoomJoinedPayload
    ): Extract<RoomServerMessage, { type: 'room:joined' }> => ({
      type: 'room:joined',
      payload,
    }),
    left: (
      payload: RoomLeftPayload
    ): Extract<RoomServerMessage, { type: 'room:left' }> => ({
      type: 'room:left',
      payload,
    }),
    list: (
      payload: RoomListPayload
    ): Extract<RoomServerMessage, { type: 'room:list' }> => ({
      type: 'room:list',
      payload,
    }),
    userJoined: (
      payload: RoomUserJoinedPayload
    ): Extract<RoomServerMessage, { type: 'room:user_joined' }> => ({
      type: 'room:user_joined',
      payload,
    }),
    userLeft: (
      payload: RoomUserLeftPayload
    ): Extract<RoomServerMessage, { type: 'room:user_left' }> => ({
      type: 'room:user_left',
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
