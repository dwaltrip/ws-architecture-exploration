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
  }, {});
}

// ... rest of message helper utilities (unchanged)
```

## Chat Domain Handlers

Chat state updates stay in `chat/state-actions.ts` (renamed from `actions.ts` to clarify that these functions mutate local state). Domain message handling lives in its own module and only relies on the shared `createHandlerMap` helper. The handlers module never imports `WSClient`.

```ts
// frontend/src/chat/handlers.ts
import type { ChatServerMessage } from '../../../common/src';
import {
  addNewMessage,
  updateIsTypingStatus,
  updateMessageWithEdits,
} from './state-actions';
import { createHandlerMap } from '../../../common/src/utils/message-helpers';

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

## Chat WebSocket Actions

Domain-specific send helpers move out of the `WSClient` bootstrap. We expose them from a dedicated module that binds to an instantiated client. These helpers can grow alongside UI needs without leaking into the transport layer.

```ts
// frontend/src/chat/ws-actions.ts
import type { ClientMessage } from '../../../common/src';
import { createSendMessage } from './messages';
import type { WSClient } from '../ws/client';

type ChatWsClient = WSClient<any, ClientMessage>; // use concrete unions when the refactor lands

function createChatWsActions(client: ChatWsClient) {
  return {
    postNewMessage(roomId: string, text: string) {
      client.send(createSendMessage(text, roomId));
    },
    // add more chat-specific send helpers here as needed
  } as const;
}

export { createChatWsActions };
```

## Generic WebSocket Client

The WebSocket client becomes fully generic. It no longer knows about chat or system messages and instead accepts unions for incoming and outgoing traffic. Handlers can be registered individually via `on` or in bulk with `registerHandlers`. The `on` method still returns an unsubscribe function, which callers use for teardown. If we later need batch removal, we can introduce a companion `removeHandlers` method, but the unsubscribe handle covers the current use cases.

```ts
// frontend/src/ws/client.ts
import type { HandlerMap, MessageType, PayloadFor } from '../../../common/src/utils/message-helpers';

export type WebSocketServerMessageHandler<
  TIncoming extends { type: string; payload: unknown },
  TType extends MessageType<TIncoming>
> = (payload: PayloadFor<TIncoming, TType>) => void;

type WebSocketHandlerRegistry<
  TIncoming extends { type: string; payload: unknown }
> = Map<MessageType<TIncoming>, Set<WebSocketServerMessageHandler<TIncoming, any>>>;

export interface WebSocketClientOptions {
  maxReconnectAttempts: number;
  protocols?: string | string[];
}

export interface WebSocketClientConfig<
  TIncoming extends { type: string; payload: unknown },
  TOutgoing extends { type: string; payload: unknown }
> {
  url: string;
  options?: Partial<WebSocketClientOptions>;
  handlers?: HandlerMap<TIncoming>;
}

const DEFAULT_OPTIONS: WebSocketClientOptions = {
  maxReconnectAttempts: 5,
};

export class WSClient<
  TIncoming extends { type: string; payload: unknown },
  TOutgoing extends { type: string; payload: unknown }
> {
  private socket?: WebSocket;
  private handlers: WebSocketHandlerRegistry<TIncoming> = new Map();
  private reconnectAttempts = 0;
  private readonly url: string;
  private readonly options: Partial<WebSocketClientOptions>;
  private pendingMessages: TOutgoing[] = [];

  constructor(config: WebSocketClientConfig<TIncoming, TOutgoing>) {
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

  joinRoom(roomId: string) {
    const message: Extract<TOutgoing, { type: 'system:room-join' }> = {
      type: 'system:room-join',
      payload: { roomId: normalizeRoomId(roomId) },
    };
    this.send(message);
  }

  leaveRoom(roomId: string) {
    const message: Extract<TOutgoing, { type: 'system:room-leave' }> = {
      type: 'system:room-leave',
      payload: { roomId: normalizeRoomId(roomId) },
    };
    this.send(message);
  }

  on<TType extends MessageType<TIncoming>>(
    type: TType,
    handler: WebSocketServerMessageHandler<TIncoming, TType>
  ) {
    // identical registry logic, now typed
  }

  off<TType extends MessageType<TIncoming>>(
    type: TType,
    handler: WebSocketServerMessageHandler<TIncoming, TType>
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

// ... normalizeRoomId helper unchanged
```

## Example Client Setup

`createExampleClient` now returns the strongly typed `WSClient` instance directly. This keeps a single authoritative surface for connection management while still allowing the caller to register whichever domain handlers make sense. We eagerly register the chat handlers via `mergeHandlerMaps`, connect, and hand the client back. Consumers can call `on` or `registerHandlers` themselves and use the unsubscribe handles when they need to stop listening.

```ts
// frontend/src/ws/example.ts
import type { ClientMessage, ServerMessage } from '../../../common/src';
import { chatHandlers } from '../chat/handlers';
import { mergeHandlerMaps } from '../../../common/src/utils/message-helpers';
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
