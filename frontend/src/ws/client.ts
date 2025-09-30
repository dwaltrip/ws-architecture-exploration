import type {
  HandlerMap,
  MessageType,
  PayloadFor,
} from '../../../common/src/utils/message-helpers';
import { createTimeout, type Timeout } from '../utils/create-timeout';

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
  private readonly options: WSClientOptions;
  private pendingMessages: TOutgoing[] = [];
  private shouldReconnect = false;
  private reconnectTimeout?: Timeout;

  constructor(config: WSClientConfig<TIncoming>) {
    this.url = config.url;
    this.options = {
      ...DEFAULT_OPTIONS,
      ...(config.options ?? {}),
    };

    if (config.handlers) {
      this.registerHandlers(config.handlers);
    }
  }

  connect() {
    this.shouldReconnect = true;

    if (this.isSocketActive) {
      const dateStr = new Date().toISOString();
      console.warn(`[${dateStr}] WebSocket is already connected or connecting`);
      return;
    }

    this.spawnSocket();
  }

  disconnect() {
    this.shouldReconnect = false;
    this.reconnectTimeout?.clear();

    if (!this.socket) {
      this.cleanupAfterClose();
      return;
    }

    if (this.isSocketActive || this.isSocketClosing) {
      this.socket.close();
    }

    this.socket = undefined;
    this.cleanupAfterClose();
  }

  send(message: TOutgoing) {
    const socket = this.openSocket;

    if (!socket) {
      this.pendingMessages.push(message);

      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        this.connect();
      }

      return;
    }

    socket.send(this.encode(message));
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
      this.reconnectTimeout = createTimeout(() => {
        if (!this.shouldReconnect) {
          return;
        }
        this.connect();
      }, this.reconnectAttempts * 1000);
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
      this.handleSocketClosed();
    });

    socket.addEventListener('error', (event) => {
      console.error('WebSocket encountered an error:', event);
    });
  }

  private handleSocketClosed() {
    this.socket = undefined;

    if (!this.shouldReconnect) {
      this.cleanupAfterClose();
      return;
    }

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.cleanupAfterClose();
      return;
    }

    this.reconnectAttempts += 1;
    const retryDelay = this.reconnectAttempts * 1000;
    this.reconnectTimeout?.clear();

    setTimeout(() => {
      if (!this.shouldReconnect) {
        return;
      }

      this.connect();
    }, retryDelay);
  }

  private cleanupAfterClose() {
    this.pendingMessages = [];
    this.reconnectAttempts = 0;
  }

  private spawnSocket() {
    this.reconnectTimeout?.clear();
    const socket = new WebSocket(this.url, this.options.protocols);
    this.attachSocketListeners(socket);
    this.socket = socket;
  }

  private dispatch(message: TIncoming) {
    const handlers = this.handlers.get(message.type);
    handlers?.forEach((handler) => {
      handler(message.payload as never);
    });
  }

  private flushPendingMessages() {
    const socket = this.openSocket;
    if (!socket) {
      return;
    }

    while (this.pendingMessages.length > 0 && socket.readyState === WebSocket.OPEN) {
      const message = this.pendingMessages.shift();
      if (!message) {
        continue;
      }
      socket.send(this.encode(message));
    }
  }

  private get openSocket() {
    const socket = this.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return undefined;
    }

    return socket;
  }

  private get isSocketOpen() {
    return Boolean(this.openSocket);
  }

  private get isSocketActive() {
    const state = this.socket?.readyState;
    return state === WebSocket.OPEN || state === WebSocket.CONNECTING;
  }

  private get isSocketClosing() {
    return this.socket?.readyState === WebSocket.CLOSING;
  }

  private decode(raw: string): TIncoming {
    return JSON.parse(raw) as TIncoming;
  }

  private encode(message: TOutgoing) {
    return JSON.stringify(message);
  }
}
