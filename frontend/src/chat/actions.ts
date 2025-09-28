import type { ChatMessage } from "../../../common/src/types/db";

import type { AppWsClient } from "../ws/types";
import type { ChatActions } from "./types";
import { type useChatStore } from "../pages/chat-page/chat-store";
import { type SystemWsEffects } from "../system";
import { type ChatWsEffects } from "./ws-effects";

interface ChatActionDeps {
  // getWsClient: () => AppWsClient;
  getSystemWsEffects: () => SystemWsEffects;

  getChatStore: () => typeof useChatStore;
  getChatWsEffects: () => ChatWsEffects;
}

function createChatActions({
  // getWsClient,
  getSystemWsEffects,
  getChatStore,
  getChatWsEffects,
}: ChatActionDeps
): ChatActions {
  return {
    sendMessage(roomId: string, text: string) {
      getChatWsEffects().postNewMessage(roomId, text);
    },

    addReceivedMessage(chatMsg: ChatMessage) {
      console.log('[ChatClientActions] message received', chatMsg);
      getChatStore().getState().addMessage(chatMsg);
    },

    joinRoom(roomId: string) {
      getSystemWsEffects().joinRoom(roomId);
    }
  }
}

const getChatActions = (function() {
  let actions = null as ChatActions | null;

  return function getChatActions(deps: ChatActionDeps): ChatActions {
    if (!actions) {
      actions = createChatActions(deps);
    }
    return actions;
  }
})();


export type { ChatActions, ChatActionDeps };
// export { createChatActions, getChatActions };
export { getChatActions };
