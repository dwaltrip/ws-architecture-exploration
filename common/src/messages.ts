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
import type {
  TimerClientMessage,
  TimerClientMessageType,
  TimerClientPayloadMap,
} from './timer/client-messages';
import type {
  TimerServerMessage,
  TimerServerMessageType,
  TimerServerPayloadMap,
} from './timer/server-messages';

export type ClientMessageMap =
  & ChatClientPayloadMap
  & SystemClientPayloadMap
  & TimerClientPayloadMap;

export type ServerMessageMap =
  & ChatServerPayloadMap
  & SystemServerPayloadMap
  & TimerServerPayloadMap;

export type ClientMessage = MessageUnion<ClientMessageMap>;
export type ServerMessage = MessageUnion<ServerMessageMap>;

export type ClientMessageType =
  | ChatClientMessageType
  | SystemClientMessageType
  | TimerClientMessageType;

export type ServerMessageType =
  | ChatServerMessageType
  | SystemServerMessageType
  | TimerServerMessageType;

export type DomainClientMessage = ChatClientMessage | TimerClientMessage;
export type DomainServerMessage = ChatServerMessage | TimerServerMessage;

export type { ChatClientMessage, ChatServerMessage };
export type { SystemClientMessage };
export type { TimerClientMessage, TimerServerMessage };
