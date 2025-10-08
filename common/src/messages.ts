import type { MessageUnion } from './utils/message-helpers';

import type {
  ChatClientMessage,
  ChatClientMessageType,
  ChatClientPayloadMap,
} from './chat/client-messages'
import type {
  ChatServerMessage,
  ChatServerMessageType,
  ChatServerPayloadMap,
} from './chat/server-messages';

import type {
  SystemClientMessage,
  SystemClientMessageType,
  SystemClientPayloadMap,
} from './system/client-messages';
import type {
  SystemServerPayloadMap,
  SystemServerMessageType,
  SystemServerMessage,
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

import type {
  GameClientMessage,
  GameClientMessageType,
  GameClientPayloadMap,
} from './game/client-messages';
import type {
  GameServerMessage,
  GameServerMessageType,
  GameServerPayloadMap,
} from './game/server-messages';

// ----------------------------------------------------------------------------

export type ClientMessageMap =
  & ChatClientPayloadMap
  & SystemClientPayloadMap
  & TimerClientPayloadMap
  & GameClientPayloadMap;

export type ServerMessageMap =
  & ChatServerPayloadMap
  & SystemServerPayloadMap
  & TimerServerPayloadMap
  & GameServerPayloadMap;

export type ClientMessage = MessageUnion<ClientMessageMap>;
export type ServerMessage = MessageUnion<ServerMessageMap>;

export type ClientMessageType =
  | ChatClientMessageType
  | SystemClientMessageType
  | TimerClientMessageType
  | GameClientMessageType;

export type ServerMessageType =
  | ChatServerMessageType
  | SystemServerMessageType
  | TimerServerMessageType
  | GameServerMessageType;

export type DomainClientMessage =
  | SystemClientMessage
  | ChatClientMessage
  | TimerClientMessage
  | GameClientMessage;

export type DomainServerMessage =
  | SystemServerMessage
  | ChatServerMessage
  | TimerServerMessage
  | GameServerMessage;
