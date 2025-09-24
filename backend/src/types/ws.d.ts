declare module 'ws' {
  export type RawData = string | ArrayBuffer;

  export class WebSocket {
    readyState: number;
    send(data: string): void;
    close(): void;
    on(event: 'message', listener: (data: RawData) => void): void;
    on(event: 'close', listener: () => void): void;
  }

  export interface WebSocketServerOptions {
    port: number;
  }

  export class WebSocketServer {
    constructor(options: WebSocketServerOptions);
    on(event: 'connection', listener: (socket: WebSocket) => void): void;
  }
}
