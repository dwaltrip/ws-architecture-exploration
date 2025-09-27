import type { ClientMessage, ServerMessage } from '../../../common/src';
import { createSendMessage } from './messages';
import type { WSClient } from '../ws/client';
import { useMemo } from 'react';
import { getOrCreateWsClient } from '../ws/create-client';

type ChatWsClient = WSClient<ServerMessage, ClientMessage>;

function createChatWsEffects(client: ChatWsClient) {
  return {
    postNewMessage(roomId: string, text: string) {
      client.send(createSendMessage(text, roomId));
    },
  } as const;
}

// function useChatWsEffects(client: ChatWsClient) {
function useChatWsEffects() {
  return useMemo(() => {
    console.log('Creating chat WS effects');
    const client = getOrCreateWsClient();
    return createChatWsEffects(client);
  }, []);
}

export { createChatWsEffects, useChatWsEffects };
