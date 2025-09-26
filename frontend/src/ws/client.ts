import type {
  HandlerMap,
  MessageType,
  PayloadFor,
} from '../../../common/src/utils/message-helpers';

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

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.socket = new WebSocket(this.url, this.options.protocols);
    this.attachSocketListeners(this.socket);
  }

  // TODO: what happens if this is called during "connecting" state?
  disconnect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket?.close();
      this.socket = undefined;
      this.pendingMessages = [];
    }
  }

  send(message: TOutgoing) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.pendingMessages.push(message);

      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        this.connect();
      }

      return;
    }

    this.socket.send(this.encode(message));
  }

  on<TType extends MessageType<TIncoming>>(
    type: TType,
    handler: ServerMessageHandler<TIncoming, TType>
  ) {
    const registry = this.handlers.get(type) ?? new Set();
    registry.add(handler as ServerMessageHandler<TIncoming, any>);
    this.handlers.set(type, registry);

    return () => this.off(type, handler);
  }

  off<TType extends MessageType<TIncoming>>(
    type: TType,
    handler: ServerMessageHandler<TIncoming, TType>
  ) {
    const registry = this.handlers.get(type);
    if (!registry) {
      return;
    }

    registry.delete(handler as ServerMessageHandler<TIncoming, any>);
    if (registry.size === 0) {
      this.handlers.delete(type);
    }
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
    socket.addEventListener('open', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.flushPendingMessages();
    });

    socket.addEventListener('message', (event) => {
      try {
        if (typeof event.data !== 'string') {
          throw new Error('Unsupported WebSocket message format');
        }

        const data = this.decode(event.data);
        this.dispatch(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    });

    socket.addEventListener('close', () => {
      const { maxReconnectAttempts } = { ...DEFAULT_OPTIONS, ...this.options };

      if (this.reconnectAttempts < maxReconnectAttempts) {
        this.reconnectAttempts += 1;
        const retryDelay = this.reconnectAttempts * 1000;
        setTimeout(() => this.connect(), retryDelay);
      }
    });

    socket.addEventListener('error', (event) => {
      console.error('WebSocket encountered an error:', event);
    });
  }

  private dispatch(message: TIncoming) {
    const handlers = this.handlers.get(message.type);
    handlers?.forEach((handler) => {
      handler(message.payload as never);
    });
  }

  private flushPendingMessages() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    while (this.pendingMessages.length > 0 && this.socket.readyState === WebSocket.OPEN) {
      const message = this.pendingMessages.shift();
      if (!message) {
        continue;
      }

      this.socket.send(this.encode(message));
    }
  }

  private decode(raw: string): TIncoming {
    return JSON.parse(raw) as TIncoming;
  }

  private encode(message: TOutgoing) {
    return JSON.stringify(message);
  }
}
