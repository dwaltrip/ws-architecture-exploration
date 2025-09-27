import { mergeHandlerMaps } from '../../../common/src';
import type { AppIncomingMessage, AppOutgoingMessage, AppWsClient } from './types';

import { WSClient } from './client';
import { getChatHandlers } from '../chat/handlers';

const WEBSOCKET_URL = 'ws://localhost:3000';

function createWsClient(): AppWsClient {
  const client = new WSClient<AppIncomingMessage, AppOutgoingMessage>({
    url: WEBSOCKET_URL,
    handlers: mergeHandlerMaps(getChatHandlers()),
  });

  client.connect();

  return client;
}

const getOrCreateWsClient: (() => AppWsClient) = (() => {
  let socket =
    undefined as WSClient<AppIncomingMessage, AppOutgoingMessage> | undefined;

  return function getOrCreateWsClient() {
    if (!socket) {
      socket = createWsClient();
    }
    return socket;
  };
})();

export { createWsClient, getOrCreateWsClient };
