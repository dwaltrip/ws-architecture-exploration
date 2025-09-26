# Frontend WebSocket Refactor (Draft)

## Common Message Utilities

We extend the shared message helpers with strongly typed handler maps so each domain can describe its server payloads without depending on `WSClient`. The helpers work with any `{ type, payload }` union and keep inference intact.

```ts
// common/src/utils/message-helpers.ts
export type HandlerPayloadMap<TUnion extends { type: string; payload: unknown }> = {
  [TType in MessageType<TUnion>]?: PayloadFor<TUnion, TType>;
};

export type HandlerMap<TUnion extends { type: string; payload: unknown }> = {
  [TType in MessageType<TUnion>]?: (payload: PayloadFor<TUnion, TType>) => void;
};

export function createHandlerMap<TUnion extends { type: string; payload: unknown }>(
  handlers: HandlerMap<TUnion>
) {
  return handlers;
}

export function mergeHandlerMaps<TUnion extends { type: string; payload: unknown }>(
  ...maps: HandlerMap<TUnion>[]
) {
  return maps.reduce<HandlerMap<TUnion>>((merged, map) => {
    (Object.keys(map) as Array<MessageType<TUnion>>).forEach((type) => {
      merged[type] = map[type];
    });
    return merged;
  }, {} as HandlerMap<TUnion>);
}

// ... rest of message helper utilities (unchanged)
```

## Chat Domain Handlers

Chat state updates stay in `chat/actions.ts`. Domain message handling lives in its own module and only relies on the shared `createHandlerMap` helper, so the handlers module never imports `WSClient`.

```ts
// frontend/src/chat/handlers.ts
import type { ChatServerMessage } from '../../../common/src';
import {
  addNewMessage,
  updateIsTypingStatus,
  updateMessageWithEdits,
} from './actions';
import { createHandlerMap } from '../../../common/src';

const chatHandlers = createHandlerMap<ChatServerMessage>({
  'chat:message': (payload) => {
    const { text, roomId, userId } = payload;
    addNewMessage(text, roomId, userId);
  },
  'chat:edited': (payload) => {
    const { messageId, newText } = payload;
    updateMessageWithEdits(messageId, newText);
  },
  'chat:typing': (payload) => {
    const { roomId, userId, isTyping } = payload;
    updateIsTypingStatus(roomId, userId, isTyping);
  },
});

export { chatHandlers };
```

## Chat WebSocket Effects

Domain-specific send helpers move out of the `WSClient` bootstrap. We expose them from a dedicated module that binds to an instantiated client so UI code can call clear effects without worrying about message construction.

```ts
// frontend/src/chat/ws-effects.ts
import type { ClientMessage, ServerMessage } from '../../../common/src';
import { createSendMessage } from './messages';
import type { WSClient } from '../ws/client';

type ChatWsClient = WSClient<ServerMessage, ClientMessage>;

function createChatWsEffects(client: ChatWsClient) {
  return {
    postNewMessage(roomId: string, text: string) {
      client.send(createSendMessage(text, roomId));
    },
    // add more chat-specific send helpers here as needed
  } as const;
}

export { createChatWsEffects };
```

## System WebSocket Effects

Room management becomes another domain-level helper instead of living on the generic client. The helpers wrap the same strongly typed client instance, so we keep the system behavior small and composable.

```ts
// frontend/src/system/ws-effects.ts
import type { ClientMessage, ServerMessage } from '../../../common/src';
import type { WSClient } from '../ws/client';

type SystemWsClient = WSClient<ServerMessage, ClientMessage>;

type SystemRoomJoinMessage = Extract<ClientMessage, { type: 'system:room-join' }>;
type SystemRoomLeaveMessage = Extract<ClientMessage, { type: 'system:room-leave' }>;

function normalizeRoomId(roomId: string) {
  const trimmed = roomId.trim();
  if (!trimmed) {
    throw new Error('Room id must be a non-empty string');
  }

  return trimmed;
}

function createSystemWsEffects(client: SystemWsClient) {
  return {
    joinRoom(roomId: string) {
      const message: SystemRoomJoinMessage = {
        type: 'system:room-join',
        payload: { roomId: normalizeRoomId(roomId) },
      };

      client.send(message);
    },
    leaveRoom(roomId: string) {
      const message: SystemRoomLeaveMessage = {
        type: 'system:room-leave',
        payload: { roomId: normalizeRoomId(roomId) },
      };

      client.send(message);
    },
  } as const;
}

export { createSystemWsEffects };
```

## Generic WebSocket Client

The WebSocket client is fully generic. It no longer knows about any specific domain and instead works with `{ type, payload }` unions for both incoming and outgoing traffic. Handlers can be registered individually via `on` or in bulk with `registerHandlers`. The `on` method still returns an unsubscribe function, which callers use for teardown. If we later need batch removal, we can introduce a companion `removeHandlers` method, but the per-handler unsubscribe covers today’s needs.

```ts
// frontend/src/ws/client.ts
import type { HandlerMap, MessageType, PayloadFor } from '../../../common/src/utils/message-helpers';

export type ServerMessageHandler<
  TIncoming extends { type: string; payload: unknown },
  TType extends MessageType<TIncoming>
> = (payload: PayloadFor<TIncoming, TType>) => void;

type HandlerRegistry<
  TIncoming extends { type: string; payload: unknown }
> = Map<MessageType<TIncoming>, Set<ServerMessageHandler<TIncoming, any>>>;

export interface WSClientOptions {
  maxReconnectAttempts: number;
  protocols?: string | string[];
}

const DEFAULT_OPTIONS: WSClientOptions = {
  maxReconnectAttempts: 5,
};

export interface WSClientConfig<
  TIncoming extends { type: string; payload: unknown }
> {
  url: string;
  options?: Partial<WSClientOptions>;
  handlers?: HandlerMap<TIncoming>;
}

export class WSClient<
  TIncoming extends { type: string; payload: unknown },
  TOutgoing extends { type: string; payload: unknown }
> {
  private socket?: WebSocket;
  private handlers: HandlerRegistry<TIncoming> = new Map();
  private reconnectAttempts = 0;
  private readonly url: string;
  private readonly options: Partial<WSClientOptions>;
  private pendingMessages: TOutgoing[] = [];

  constructor(config: WSClientConfig<TIncoming>) {
    this.url = config.url;
    this.options = config.options ?? {};

    if (config.handlers) {
      this.registerHandlers(config.handlers);
    }
  }

  connect() { /* unchanged socket setup */ }
  disconnect() { /* unchanged close behavior + pending flush reset */ }

  send(message: TOutgoing) {
    // identical control flow, but `message` is strongly typed
  }

  on<TType extends MessageType<TIncoming>>(
    type: TType,
    handler: ServerMessageHandler<TIncoming, TType>
  ) {
    // identical registry logic, now typed
  }

  off<TType extends MessageType<TIncoming>>(
    type: TType,
    handler: ServerMessageHandler<TIncoming, TType>
  ) {
    // identical cleanup logic
  }

  registerHandlers(handlerMap: HandlerMap<TIncoming>) {
    (Object.keys(handlerMap) as Array<MessageType<TIncoming>>).forEach((type) => {
      const handler = handlerMap[type];
      if (handler) {
        this.on(type, handler);
      }
    });
  }

  private attachSocketListeners(socket: WebSocket) {
    // unchanged except `this.dispatch(this.decode(event.data))`
  }

  private dispatch(message: TIncoming) {
    const handlers = this.handlers.get(message.type);
    handlers?.forEach((handler) => handler(message.payload as never));
  }

  private flushPendingMessages() { /* unchanged pending send loop */ }

  private decode(raw: string): TIncoming {
    return JSON.parse(raw) as TIncoming;
  }

  private encode(message: TOutgoing) {
    return JSON.stringify(message);
  }
}
```

## Example Client Setup

`createExampleClient` now returns the strongly typed `WSClient` instance directly. This keeps a single authoritative surface for connection management while still allowing the caller to register whichever domain handlers make sense. We eagerly register the chat handlers via `mergeHandlerMaps`, connect, and hand the client back. Consumers can call `on` or `registerHandlers` themselves and use the unsubscribe handles when they need to stop listening.

```ts
// frontend/src/ws/example.ts
import type { ClientMessage, ServerMessage } from '../../../common/src';
import { chatHandlers } from '../chat';
import { mergeHandlerMaps } from '../../../common/src';
import { WSClient } from './client';

type AppIncomingMessage = ServerMessage;
type AppOutgoingMessage = ClientMessage;

function createExampleClient(url: string) {
  const client = new WSClient<AppIncomingMessage, AppOutgoingMessage>({
    url,
    handlers: mergeHandlerMaps(chatHandlers),
  });

  client.connect();

  return client;
}

// ... getOrCreateExampleClient closure unchanged, now returning the raw client
```

## Natural Next Steps

1. Finalize naming for the chat modules (`state-actions.ts`, `ws-actions.ts`) and update imports accordingly.
2. Implement the snippets, ensuring TypeScript can infer payload types in both handler registration and chat action helpers.
3. Add unit coverage or lightweight smoke tests for `registerHandlers` and the pending message queue once the refactor is in place.
