import { useMemo } from "react";
import type { ChatMessage } from "../../../common/src/types/db";

import type { ChatActions } from "./types";
import { getChatStore, type useChatStore } from "../pages/chat-page/chat-store";
import { getSystemWsEffects, type SystemWsEffects } from "../system";
import { getOrCreateWsClient } from "../ws/create-client";
import { getChatWsEffects, type ChatWsEffects } from "./ws-effects";

interface ChatActionsDeps {
  chatStore: typeof useChatStore;
  chatWsEffects: ChatWsEffects;
  systemWsEffects: SystemWsEffects;
}

function createChatActions(
  { chatStore, chatWsEffects, systemWsEffects }: ChatActionsDeps 
): ChatActions {
  return {
    sendMessage(roomId: string, text: string) {
      chatWsEffects.postNewMessage(roomId, text);
    },

    addReceivedMessage(chatMsg: ChatMessage) {
      console.log('[ChatClientActions] message received', chatMsg);
      chatStore.getState().addMessage(chatMsg);
    },

    joinRoom(roomId: string) {
      systemWsEffects.joinRoom(roomId);
    }
  }
}

const _getChatActions = (function() {
  let actions = null as ChatActions | null;

  function _getChatActions(getChatStore: () => typeof useChatStore): ChatActions {
    const client = getOrCreateWsClient();
    if (!actions) {
      actions = createChatActions({
        chatStore: getChatStore(),
        chatWsEffects: getChatWsEffects(client),
        systemWsEffects: getSystemWsEffects(client),
      });
    }
    return actions;
  }
  return _getChatActions;
})();

function getChatActions() {
  return _getChatActions(getChatStore);
}

function useChatActions(): ChatActions {
  const actions = useMemo(getChatActions, []);
  return actions;
}

export type { ChatActions };
export { createChatActions, getChatActions, useChatActions};
