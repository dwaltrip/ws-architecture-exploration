import type { ChatMessage } from "../../../common/src/types/db";
import type { useChatStore } from "../pages/chat-page/chat-store";
import { getSystemWsEffects, type SystemWsEffects } from "../system";
import { getOrCreateWsClient } from "../ws/create-client";
import { getChatWsEffects, type ChatWsEffects } from "./ws-effects";

interface ChatActionsDeps {
  chatStore: typeof useChatStore;
  chatWsEffects: ChatWsEffects;
  systemWsEffects: SystemWsEffects;
}

interface ChatActions {
  addNewMessage: (chatMsg: ChatMessage) => void;
  joinRoom: (roomId: string) => void;
  // updateIsTypingStatus: (roomId: string, userId: string, isTyping: boolean) => void;
}

function createChatActions(
  { chatStore, chatWsEffects, systemWsEffects }: ChatActionsDeps 
): ChatActions {
  return {
    addNewMessage(chatMsg: ChatMessage) {
      console.log('[ChatClientActions] message received', chatMsg);
      chatStore.getState().addMessage(chatMsg);
    },

    joinRoom(roomId: string) {
      systemWsEffects.joinRoom(roomId);
    }
  }
}

const getChatActions = (function() {
  let actions = null as ChatActions | null;

  function getChatActions(getChatStore: () => typeof useChatStore): ChatActions {
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
  return getChatActions;
})();

export type { ChatActions };
export { createChatActions, getChatActions };
