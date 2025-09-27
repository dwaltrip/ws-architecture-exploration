import { useMemo } from 'react';

import type { AppWsClient } from '../ws/types';
import { getOrCreateWsClient } from '../ws/create-client';

import { createSendMessage } from './messages';

interface ChatWsEffects {
  postNewMessage(roomId: string, text: string): void;
}

function createChatWsEffects(client: AppWsClient) {
  return {
    postNewMessage(roomId: string, text: string) {
      if (!text.trim()) {
        return;
      }
      client.send(createSendMessage(text, roomId));
    },
  } as const;
}

const getChatWsEffects = (() => {
  let effects: ChatWsEffects | null = null;
  return function(client: AppWsClient): ChatWsEffects {
    if (!effects) {
      effects = createChatWsEffects(client);
    }
    return effects;
  };
})();

// TODO: not sure if I want this or if `getChatWsEffects` is better
// useEffect might be better
function useChatWsEffects() {
  return useMemo(() => {
    console.log('Creating chat WS effects')
    const client = getOrCreateWsClient();
    return createChatWsEffects(client);
  }, []);
}

export type { ChatWsEffects };
export { createChatWsEffects, useChatWsEffects, getChatWsEffects };
