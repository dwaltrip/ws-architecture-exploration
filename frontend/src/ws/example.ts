import type { ClientMessage, ServerMessage } from '../../../common/src';
import { chatHandlers } from '../chat';
import { mergeHandlerMaps } from '../../../common/src';
import { WSClient } from './client';

type AppIncomingMessage = ServerMessage;
type AppOutgoingMessage = ClientMessage;

function createExampleClient(url: string) {
  const client = new WSClient<AppIncomingMessage, AppOutgoingMessage>({
    url,
    handlers: mergeHandlerMaps(chatHandlers),
  });

  client.connect();

  return client;
}

const getOrCreateExampleClient = (() => {
  let socket =
    undefined as WSClient<AppIncomingMessage, AppOutgoingMessage> | undefined;

  return function getOrCreateExampleClient(url: string) {
    if (!socket) {
      socket = createExampleClient(url);
    }
    return socket;
  };
})();

export { getOrCreateExampleClient };
