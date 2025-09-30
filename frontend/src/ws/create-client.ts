import type { AppIncomingMessage, AppOutgoingMessage, AppWsClient } from './types';

import { WSClient } from './client';

const WEBSOCKET_URL = 'ws://localhost:3000';

const wsClient = new WSClient<AppIncomingMessage, AppOutgoingMessage>({
  url: WEBSOCKET_URL,
});

function connectWsClient(): AppWsClient {
  wsClient.connect();
  return wsClient;
}

function getWsClient(): AppWsClient {
  return wsClient;
}

export { connectWsClient, getWsClient };
