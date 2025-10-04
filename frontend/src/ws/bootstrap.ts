import type { AppIncomingMessage, AppOutgoingMessage } from './types';
import type { HandlerMap } from '../../../common/src/utils/message-helpers';

import { WSClient } from './client';
import { chatHandlers } from '../chat/handlers';
import { systemHandlers } from '../system/handlers';
import { initChatWsEffects, resetChatWsEffectsForTests } from '../chat/ws-effects';
import { initSystemWsEffects, resetSystemWsEffectsForTests } from '../system/ws-effects';

const WEBSOCKET_URL = 'ws://localhost:3000';

let wsClient: WSClient<AppIncomingMessage, AppOutgoingMessage> | null = null;

export function initializeWsApp(): WSClient<AppIncomingMessage, AppOutgoingMessage> {
  if (wsClient) {
    return wsClient;
  }

  // Merge all domain handlers - compile-time completeness check
  const allHandlers = {
    ...chatHandlers,
    ...systemHandlers,
  } satisfies HandlerMap<AppIncomingMessage>;

  // Create client with all handlers upfront
  wsClient = new WSClient<AppIncomingMessage, AppOutgoingMessage>({
    url: WEBSOCKET_URL,
    handlers: allHandlers,
  });

  // Wire up ws-effects after client exists
  initChatWsEffects(wsClient);
  initSystemWsEffects(wsClient);

  if (import.meta.env.DEV) {
    assertHandlersInitializedInDev(wsClient, allHandlers);
  }

  // Connect once
  wsClient.connect();

  return wsClient;
}

export function getWsClient(): WSClient<AppIncomingMessage, AppOutgoingMessage> {
  if (!wsClient) {
    throw new Error('WS client not initialized. Call initializeWsApp() first.');
  }
  return wsClient;
}

// For tests
export function resetWsInitializationForTests(): void {
  wsClient?.disconnect();
  wsClient = null;
  resetChatWsEffectsForTests();
  resetSystemWsEffectsForTests();
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
