import type {
  ClientMessage,
  MessageType,
  PayloadFor,
  ServerMessage,
} from '../../../common/src';

export type ServerMessageHandler<TType extends ServerMessage['type']> = (
  payload: PayloadFor<ServerMessage, TType>
) => void;

type HandlerRegistry = Map<ServerMessage['type'], Set<ServerMessageHandler<any>>>;

export interface WSClientOptions {
  maxReconnectAttempts: number;
  protocols?: string | string[];
}

const DEFAULT_OPTIONS: WSClientOptions = {
  maxReconnectAttempts: 5,
};

export class WSClient {
  private socket?: WebSocket;
  private handlers: HandlerRegistry = new Map();
  private reconnectAttempts = 0;
  private readonly url: string;
  private readonly options: Partial<WSClientOptions>;

  constructor(url: string, options: Partial<WSClientOptions> = {}) {
    this.url = url;
    this.options = options;
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.socket = new WebSocket(this.url, this.options.protocols);
    this.wireEventHandlers();
  }

  disconnect() {
    this.socket?.close();
    this.socket = undefined;
  }

  send(message: ClientMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.socket.send(JSON.stringify(message));
  }

  on<TType extends MessageType<ServerMessage>>(
    type: TType,
    handler: ServerMessageHandler<TType>
  ) {
    const registry = this.handlers.get(type) ?? new Set();
    registry.add(handler as ServerMessageHandler<any>);
    this.handlers.set(type, registry);

    return () => this.off(type, handler);
  }

  off<TType extends MessageType<ServerMessage>>(
    type: TType,
    handler: ServerMessageHandler<TType>
  ) {
    const registry = this.handlers.get(type);
    if (!registry) {
      return;
    }

    registry.delete(handler as ServerMessageHandler<any>);
    if (registry.size === 0) {
      this.handlers.delete(type);
    }
  }

  private wireEventHandlers() {
    if (!this.socket) {
      return;
    }

    this.socket.addEventListener('open', () => {
      this.reconnectAttempts = 0;
    });

    this.socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;
        this.dispatch(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    });

    this.socket.addEventListener('close', () => {
      const { maxReconnectAttempts } = { ...DEFAULT_OPTIONS, ...this.options };

      if (this.reconnectAttempts < maxReconnectAttempts) {
        this.reconnectAttempts += 1;
        const retryDelay = this.reconnectAttempts * 1000;
        setTimeout(() => this.connect(), retryDelay);
      }
    });
  }

  private dispatch(message: ServerMessage) {
    const handlers = this.handlers.get(message.type);
    handlers?.forEach((handler) => {
      handler(message.payload as never);
    });
  }
}
