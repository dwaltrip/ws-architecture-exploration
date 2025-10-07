import type { AppIncomingMessage, AppOutgoingMessage } from './types';
import type { HandlerMap } from '../../../common/src/utils/message-helpers';

import { WSClient } from './client';
import { chatHandlers } from '../chat/handlers';
import { systemHandlers } from '../system/handlers';
import { timerHandlers } from '../timer/handlers';
import { gameHandlers } from '../game/handlers';
import { chatWs } from '../chat/ws-effects';
import { systemWs } from '../system/ws-effects';
import { timerWs } from '../timer/ws-effects';
import { gameWs } from '../game/ws-effects';
import { useEffect, useState } from 'react';

const WEBSOCKET_URL = 'ws://localhost:3000';

let wsClient: WSClient<AppIncomingMessage, AppOutgoingMessage> | null = null;

function initializeWsApp(): WSClient<AppIncomingMessage, AppOutgoingMessage> {
  if (wsClient) {
    return wsClient;
  }

  // Merge all domain handlers - compile-time completeness check
  const allHandlers = {
    ...chatHandlers,
    ...systemHandlers,
    ...timerHandlers,
    ...gameHandlers,
  } satisfies HandlerMap<AppIncomingMessage>;

  // Create client with all handlers upfront
  wsClient = new WSClient<AppIncomingMessage, AppOutgoingMessage>({
    url: WEBSOCKET_URL,
    handlers: allHandlers,
  });

  // Wire up ws-effects after client exists
  chatWs.init(wsClient);
  systemWs.init(wsClient);
  timerWs.init(wsClient);
  gameWs.init(wsClient);

  if (import.meta.env.DEV) {
    assertHandlersInitializedInDev(wsClient, allHandlers);
  }

  // Connect once
  wsClient.connect();

  return wsClient;
}

function getWsClient(): WSClient<AppIncomingMessage, AppOutgoingMessage> {
  if (!wsClient) {
    throw new Error('WS client not initialized. Call initializeWsApp() first.');
  }
  return wsClient;
}

// For tests
export function resetWsInitializationForTests(): void {
  wsClient?.disconnect();
  wsClient = null;
  chatWs.reset();
  systemWs.reset();
  timerWs.reset();
  gameWs.reset();
}

function assertHandlersInitializedInDev(
  client: WSClient<AppIncomingMessage, AppOutgoingMessage>,
  expected: HandlerMap<AppIncomingMessage>,
): void {
  (Object.keys(expected) as Array<keyof HandlerMap<AppIncomingMessage>>).forEach((type) => {
    if (!client.getHandler(type)) {
      throw new Error(`Expected WebSocket handler for message type "${String(type)}" to be registered`);
    }
  });
}

function useInitializeWsApp(): boolean {
  const [isInitialized, setIsInitialized] = useState(() => wsClient !== null);

  useEffect(() => {
    initializeWsApp();
    setIsInitialized(true);
    // No cleanup - app-level singleton lifecycle
  }, []);

  return isInitialized;
}

export { getWsClient, useInitializeWsApp };
