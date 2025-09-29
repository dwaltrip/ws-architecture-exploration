import type { AppIncomingMessage, AppOutgoingMessage, AppWsClient } from './types';

import { WSClient } from './client';

const WEBSOCKET_URL = 'ws://localhost:3000';

const wsClient = new WSClient<AppIncomingMessage, AppOutgoingMessage>({
  url: WEBSOCKET_URL,
});

let isConnected = false;

function connectWsClient(): AppWsClient {
  if (!isConnected) {
    wsClient.connect();
    isConnected = true;
  }

  return wsClient;
}

function getWsClient(): AppWsClient {
  return wsClient;
}

export { connectWsClient, getWsClient };
