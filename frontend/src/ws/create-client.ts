import { mergeHandlerMaps } from '../../../common/src';
import type { AppIncomingMessage, AppOutgoingMessage, AppWsClient } from './types';

import { WSClient } from './client';
// import { getChatHandlers } from '../chat/handlers';
import type { ChatHandlerMap } from '../chat/handlers';

const WEBSOCKET_URL = 'ws://localhost:3000';

interface Deps {
  getChatHandlers: () => ChatHandlerMap;
}

function createWsClient({ getChatHandlers }: Deps): AppWsClient {
  const client = new WSClient<AppIncomingMessage, AppOutgoingMessage>({
    url: WEBSOCKET_URL,
    handlers: mergeHandlerMaps(getChatHandlers()),
    // handlers: mergeHandlerMaps(getChatHandlers),
  });

  client.connect();

  return client;
}

const getOrCreateWsClient = (() => {
  let socket =
    undefined as WSClient<AppIncomingMessage, AppOutgoingMessage> | undefined;

  return function getOrCreateWsClient(deps: Deps): AppWsClient {
    if (!socket) {
      socket = createWsClient(deps);
    }
    return socket;
  };
})();

// export { createWsClient, getOrCreateWsClient };
export { getOrCreateWsClient };
