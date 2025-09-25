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
    /* ------------------------------------------------------------------------
      TODO: this used to be done via "room" domain but we are going to make
      room management more of a built-in part of the ws infra code.
      It will be handled in a more generic way by the client and server, as
      "rooms" are a very generic concept used by most realtime apps.
    -------------------------------------------------------- */
    // sendJoin(roomId: string) {
    //   client.send(roomMessages.join(roomId));
    // },
    sendChat(roomId: string, text: string) {
      client.send(chatMessages.send(text, roomId));
    },
    dispose() {
      subscriptions.forEach((unsubscribe) => unsubscribe());
      client.disconnect();
    },
  } as const;
}
