import { mergeHandlerMaps } from '../../../common/src';
import type { AppIncomingMessage, AppOutgoingMessage, AppWsClient } from './types';

import { WSClient } from './client';
import { chatHandlers } from '../chat';

const WEBSOCKET_URL = 'ws://localhost:3000';

function createWsClient(): AppWsClient {
  const client = new WSClient<AppIncomingMessage, AppOutgoingMessage>({
    url: WEBSOCKET_URL,
    handlers: mergeHandlerMaps(chatHandlers),
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
