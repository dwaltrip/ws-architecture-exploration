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

const RECONNECT_BASE_DELAY_MS = 1000;

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
  private isConnecting = false;

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

    if (this.isConnecting || this.isSocketInState(WebSocket.OPEN, WebSocket.CONNECTING)) {
      const dateStr = new Date().toISOString();
      console.warn(`[${dateStr}] WebSocket is already connected or connecting`);
      return;
    }

    this.spawnSocket();
  }

  disconnect() {
    this.shouldReconnect = false;
    this.isConnecting = false;
    this.reconnectTimeout?.clear();

    const socket = this.socket;
    this.socket = undefined;

    if (socket && this.isSocketInStateFor(socket, WebSocket.OPEN, WebSocket.CONNECTING, WebSocket.CLOSING)) {
      socket.close();
    }

    this.cleanupAfterClose();
  }

  send(message: TOutgoing) {
    const socket = this.openSocket;

    if (!socket) {
      this.pendingMessages.push(message);
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
      this.on(type, handlerMap[type]);
    });
  }

  private attachSocketListeners(socket: WebSocket) {
    socket.addEventListener('open', () => {
      // Ignore stale open events - only process if we're still connecting
      if (!this.isConnecting) {
        return;
      }

      console.log('WebSocket connected');
      this.isConnecting = false;
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
      this.isConnecting = false;
      this.handleSocketClosed();
    });

    socket.addEventListener('error', (event) => {
      console.error('WebSocket encountered an error:', event);
    });
  }

  private handleSocketClosed() {
    // Ignore stale close events - only process if socket is still set
    // (spawnSocket clears it before creating new socket)
    if (this.socket === undefined) {
      return;
    }

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
    const retryDelay = this.reconnectAttempts * RECONNECT_BASE_DELAY_MS;
    this.reconnectTimeout?.clear();

    this.reconnectTimeout = createTimeout(() => {
      if (!this.shouldReconnect) {
        return;
      }
      this.connect();
    }, retryDelay);
    this.reconnectTimeout.start();
  }

  private cleanupAfterClose() {
    this.pendingMessages = [];
    this.reconnectAttempts = 0;
  }

  private spawnSocket() {
    this.reconnectTimeout?.clear();

    // Clean up any existing socket before spawning a new one
    const oldSocket = this.socket;
    if (oldSocket) {
      this.socket = undefined;
      if (this.isSocketInStateFor(oldSocket, WebSocket.OPEN, WebSocket.CONNECTING, WebSocket.CLOSING)) {
        oldSocket.close();
      }
    }

    this.isConnecting = true;
    const socket = new WebSocket(this.url, this.options.protocols);
    this.attachSocketListeners(socket);
    this.socket = socket;
  }

  private dispatch(message: TIncoming) {
    const handlers = this.handlers.get(message.type);
    handlers?.forEach((handler) => {
      try {
        // TODO: Improve type constraints to avoid 'as never' cast
        handler(message.payload as never);
      } catch (error) {
        console.error(`Error in handler for message type "${message.type}":`, error);
      }
    });
  }

  private flushPendingMessages() {
    const socket = this.openSocket;
    if (!socket) {
      return;
    }

    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift()!;
      socket.send(this.encode(message));
    }
  }

  private get openSocket() {
    const socket = this.socket;
    if (!socket || !this.isSocketInStateFor(socket, WebSocket.OPEN)) {
      return undefined;
    }

    return socket;
  }

  private isSocketInState(...states: number[]) {
    const state = this.socket?.readyState;
    return state !== undefined && states.includes(state);
  }

  private isSocketInStateFor(socket: WebSocket, ...states: number[]) {
    return states.includes(socket.readyState);
  }

  private decode(raw: string): TIncoming {
    return JSON.parse(raw) as TIncoming;
  }

  private encode(message: TOutgoing) {
    return JSON.stringify(message);
  }
}
