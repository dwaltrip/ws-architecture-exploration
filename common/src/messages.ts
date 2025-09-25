import type { MessageUnion } from './utils/message-helpers';
import type {
  ChatClientMessage,
  ChatClientMessageType,
  ChatClientPayloadMap,
  ChatServerMessage,
  ChatServerMessageType,
  ChatServerPayloadMap,
} from './chat';
import type {
  SystemServerMessage,
  SystemServerMessageType,
  SystemServerPayloadMap,
} from './system/server-messages';

export type ClientMessageMap = ChatClientPayloadMap;
// export type ClientMessageMap = ChatClientPayloadMap & SomeOtherDomainClientPayloadMap;

export type ServerMessageMap =
  & ChatServerPayloadMap
  // & SomeOtherDomainServerPayloadMap
  & SystemServerPayloadMap;

export type ClientMessage = MessageUnion<ClientMessageMap>;
export type ServerMessage = MessageUnion<ServerMessageMap>;

export type ClientMessageType = ChatClientMessageType;
// export type ClientMessageType = ChatClientMessageType | SomeOtherDomainClientMessageType;

export type ServerMessageType =
  | ChatServerMessageType
  // | SomeOtherDomainServerMessageType
  | SystemServerMessageType;

export type DomainClientMessage = ChatClientMessage;
// export type DomainClientMessage = ChatClientMessage | SomeotherDomainClientMessage;
export type DomainServerMessage = ChatServerMessage;
// export type DomainServerMessage = ChatServerMessage | SomeOtherDomainServerMessage;

export type SystemMessage = SystemServerMessage;

export type { ChatClientMessage, ChatServerMessage };
export type { SystemServerMessage };
