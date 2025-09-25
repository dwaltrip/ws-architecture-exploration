import type { ServerMessage } from '../../../common/src';
import {
  chatMessages,
  registerChatHandlers,
} from '../chat';
import { WSClient } from './client';
import type { ServerMessageHandler } from './client';

export function createExampleClient(url: string) {
  const client = new WSClient(url);
  client.connect();

  const subscriptions = [
    registerChatHandlers(client),
    // registerSomeOtherDomainHandlers(client),
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
    joinRoom(roomId: string) {
      client.joinRoom(roomId);
    },
    leaveRoom(roomId: string) {
      client.leaveRoom(roomId);
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
