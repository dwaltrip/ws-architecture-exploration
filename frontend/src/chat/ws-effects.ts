import type { AppWsClient } from '../ws/types';

import { createSendMessage } from './messages';

interface ChatWsEffects {
  postNewMessage(roomId: string, text: string): void;
}

interface Deps {
  getWsClient: () => AppWsClient;
}

function createChatWsEffects({ getWsClient }: Deps): ChatWsEffects {
  return {
    postNewMessage(roomId: string, text: string) {
      if (!text.trim()) {
        return;
      }
      getWsClient().send(createSendMessage(text, roomId));
    },
  } as const;
}

const getChatWsEffects = (() => {
  let effects: ChatWsEffects | null = null;

  return function(deps: Deps): ChatWsEffects {
    if (!effects) {
      effects = createChatWsEffects(deps);
    }
    return effects;
  };
})();

export type { ChatWsEffects };
export { createChatWsEffects, getChatWsEffects };
