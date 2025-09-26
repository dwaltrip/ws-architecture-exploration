 # Frontend WebSocket Refactor (Draft)

## Common Message Utilities

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

  ## Chat Domain Handlers

  // frontend/src/chat/handlers.ts
  import type { ChatServerMessage } from '../../../common/src';
  import {
    addNewMessage,
    updateIsTypingStatus,
    updateMessageWithEdits,
  } from './actions';
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

  ## Generic WebSocket Client

  // frontend/src/ws/client.ts
  import type { HandlerMap, MessageType, PayloadFor } from '../../../common/src/utils/message-helpers';

  export type ServerMessageHandler<
    TIncoming extends { type: string; payload: unknown },
    TType extends MessageType<TIncoming>
  > = (payload: PayloadFor<TIncoming, TType>) => void;

  type HandlerRegistry<
    TIncoming extends { type: string; payload: unknown }
  > = Map<MessageType<TIncoming>, Set<ServerMessageHandler<TIncoming, any>>>;

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
    private handlers: HandlerRegistry<TIncoming> = new Map();
    private reconnectAttempts = 0;
    private readonly url: string;
    private readonly options: Partial<WebSocketClientOptions>;
    private pending: TOutgoing[] = [];

    constructor(config: WebSocketClientConfig<TIncoming, TOutgoing>) {
      this.url = config.url;
      this.options = config.options ?? {};
      if (config.handlers) {
        this.registerHandlers(config.handlers);
      }
    }

    connect() { /* unchanged socket setup */ }
    disconnect() { /* unchanged close + pending reset */ }

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

    leaveRoom(roomId: string) { /* same as joinRoom with 'system:room-leave' */ }

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

    private flushPending() { /* unchanged pending send loop */ }

    private decode(raw: string): TIncoming {
      return JSON.parse(raw) as TIncoming;
    }

    private encode(message: TOutgoing) {
      return JSON.stringify(message);
    }
  }

  // ... normalizeRoomId helper unchanged

  ## Example Client Bootstrap

  // frontend/src/ws/example.ts
  import type {
    ClientMessage,
    ServerMessage,
  } from '../../../common/src';
  import { createSendMessage } from '../chat/messages';
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

    return {
      client,
      subscribe: client.on.bind(client),
      joinRoom: (roomId: string) => client.joinRoom(roomId),
      leaveRoom: (roomId: string) => client.leaveRoom(roomId),
      sendChat: (roomId: string, text: string) =>
        client.send(createSendMessage(text, roomId)),
      dispose: () => {
        // caller can re-register explicit handlers if needed
        client.disconnect();
      },
    } as const;
  }

  // ... getOrCreateExampleClient closure unchanged, now reusing `createExampleClient`


  ### Natural next steps

  1. Confirm naming and file placement for the new helpers (`mergeHandlerMaps`, etc.).
  2. Implement the snippets, keeping an eye on TypeScript inference in `createExampleClient`.
  3. Backfill any unit tests to cover `registerHandlers`/`send` once the refactor lands.
