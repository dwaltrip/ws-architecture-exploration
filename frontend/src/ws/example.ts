import type { ServerMessage } from '../../../common/src';
import { chatMessages } from '../chat';
import { roomMessages } from '../room';
import { WSClient } from './client';
import type { ServerMessageHandler } from './client';

export function createExampleClient(url: string) {
  const client = new WSClient(url);
  client.connect();

  const subscriptions = [
    client.on('chat:message', (payload) => {
      console.log('[chat:message]', payload);
    }),
    client.on('room:joined', (payload) => {
      console.log('[room:joined]', payload);
    }),
    client.on('error', (payload) => {
      console.error('[error]', payload);
    }),
  ];

  return {
    client,
    subscribe<TType extends ServerMessage['type']>(
      type: TType,
      handler: ServerMessageHandler<TType>
    ) {
      return client.on(type, handler);
    },
    sendJoin(roomId: string) {
      client.send(roomMessages.join(roomId));
    },
    sendChat(roomId: string, text: string) {
      client.send(chatMessages.send(text, roomId));
    },
    dispose() {
      subscriptions.forEach((unsubscribe) => unsubscribe());
      client.disconnect();
    },
  } as const;
}
