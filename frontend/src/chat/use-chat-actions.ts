import type { ChatActions } from "./types";
import { getChatActions } from "./actions";

import { getOrCreateWsClient as getWsClient } from "../ws/create-client";
import { getSystemWsEffects } from "../system";``

import { getChatWsEffects } from "./ws-effects";
import { getChatStore } from "../pages/chat-page/chat-store";

function useChatActions(): ChatActions {
  const actions = getChatActions({
    getSystemWsEffects: () => getSystemWsEffects({ getWsClient }),
    getChatStore,
    getChatWsEffects: () => getChatWsEffects({ getWsClient }),
  });
  return actions;
}

export { useChatActions };
