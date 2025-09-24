import { MessageUnion } from './utils/message-helpers';
import {
  ChatClientMessage,
  ChatClientMessageType,
  ChatClientPayloadMap,
  ChatServerMessage,
  ChatServerMessageType,
  ChatServerPayloadMap,
} from './chat';
import {
  RoomClientMessage,
  RoomClientMessageType,
  RoomClientPayloadMap,
  RoomServerMessage,
  RoomServerMessageType,
  RoomServerPayloadMap,
} from './room';
import {
  SystemServerMessage,
  SystemServerMessageType,
  SystemServerPayloadMap,
} from './system/server-messages';

export type ClientMessageMap = ChatClientPayloadMap & RoomClientPayloadMap;
export type ServerMessageMap =
  & ChatServerPayloadMap
  & RoomServerPayloadMap
  & SystemServerPayloadMap;

export type ClientMessage = MessageUnion<ClientMessageMap>;
export type ServerMessage = MessageUnion<ServerMessageMap>;

export type ClientMessageType = ChatClientMessageType | RoomClientMessageType;
export type ServerMessageType =
  | ChatServerMessageType
  | RoomServerMessageType
  | SystemServerMessageType;

export type DomainClientMessage = ChatClientMessage | RoomClientMessage;
export type DomainServerMessage = ChatServerMessage | RoomServerMessage;

export type SystemMessage = SystemServerMessage;

export { ChatClientMessage, ChatServerMessage };
export { RoomClientMessage, RoomServerMessage };
export { SystemServerMessage };
