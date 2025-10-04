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
  SystemClientMessage,
  SystemClientMessageType,
  SystemClientPayloadMap,
} from './system/client-messages';
import type {
  SystemServerPayloadMap,
  SystemServerMessageType,
} from '../src/system/server-messages';

export type ClientMessageMap =
  & ChatClientPayloadMap
  & SystemClientPayloadMap;
// export type ClientMessageMap = ChatClientPayloadMap & SomeOtherDomainClientPayloadMap;

export type ServerMessageMap = ChatServerPayloadMap & SystemServerPayloadMap;

export type ClientMessage = MessageUnion<ClientMessageMap>;
export type ServerMessage = MessageUnion<ServerMessageMap>;

export type ClientMessageType =
  | ChatClientMessageType
  | SystemClientMessageType;
// export type ClientMessageType = ChatClientMessageType | SomeOtherDomainClientMessageType;

export type ServerMessageType = ChatServerMessageType | SystemServerMessageType;

export type DomainClientMessage = ChatClientMessage;
// export type DomainClientMessage = ChatClientMessage | SomeotherDomainClientMessage;
export type DomainServerMessage = ChatServerMessage;
// export type DomainServerMessage = ChatServerMessage | SomeOtherDomainServerMessage;

export type { ChatClientMessage, ChatServerMessage };
export type { SystemClientMessage };
