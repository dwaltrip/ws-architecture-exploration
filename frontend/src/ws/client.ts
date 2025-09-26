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
  private pending: ClientMessage[] = [];

  constructor(url: string, options: Partial<WSClientOptions> = {}) {
    this.url = url;
    this.options = options;
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
      this.pending = [];
    }
  }

  send(message: ClientMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.pending.push(message);

      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        this.connect();
      }

      return;
    }

    this.socket.send(JSON.stringify(message));
  }

  joinRoom(roomId: string) {
    const normalized = normalizeRoomId(roomId);
    const message: Extract<ClientMessage, { type: 'system:room-join' }> = {
      type: 'system:room-join',
      payload: { roomId: normalized },
    };

    this.send(message);
  }

  leaveRoom(roomId: string) {
    const normalized = normalizeRoomId(roomId);
    const message: Extract<ClientMessage, { type: 'system:room-leave' }> = {
      type: 'system:room-leave',
      payload: { roomId: normalized },
    };

    this.send(message);
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

  private attachSocketListeners(socket: WebSocket) {
    socket.addEventListener('open', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.flushPending();
    });

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;
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

  private dispatch(message: ServerMessage) {
    const handlers = this.handlers.get(message.type);
    handlers?.forEach((handler) => {
      handler(message.payload as never);
    });
  }

  private flushPending() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    while (this.pending.length > 0 && this.socket.readyState === WebSocket.OPEN) {
      const message = this.pending.shift();
      if (!message) {
        continue;
      }

      this.socket.send(JSON.stringify(message));
    }
  }
}

function normalizeRoomId(roomId: string) {
  const trimmed = roomId.trim();
  if (!trimmed) {
    throw new Error('Room id must be a non-empty string');
  }

  return trimmed;
}
