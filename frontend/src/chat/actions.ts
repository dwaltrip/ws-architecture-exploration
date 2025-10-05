import type { ChatMessage } from "../../../common/src/types/db";

import { chatStore } from "./chat-store";
import { systemWsEffects } from "../system";
import { chatWsEffects } from "./ws-effects";

const MAIN_LOBBY = { id: 'general', name: 'General' };

interface ChatActions {
  sendMessage: (roomId: string, text: string) => void;
  addReceivedMessage: (chatMsg: ChatMessage) => void;
  joinGeneralRoom: () => void;
  setUsersTypingInRoom: (roomId: string, userIds: string[]) => void;
}

const chatActions: ChatActions = {
  sendMessage(roomId: string, text: string) {
    if (!text.trim()) {
      return;
    }
    chatWsEffects.postNewMessage(roomId, text);
  },

  addReceivedMessage(chatMsg) {
    console.log('[ChatClientActions] message received', chatMsg);
    chatStore.getState().addMessage(chatMsg);
  },

  // Idempotent
  joinGeneralRoom() {
    const currentRoom = chatStore.getState().currentRoom;
    if (currentRoom) {
      return;
    }
    systemWsEffects.joinRoom(MAIN_LOBBY.id);
    chatStore.getState().setCurrentRoom(MAIN_LOBBY);
  },

  setUsersTypingInRoom(roomId: string, userIds: string[]) {
    chatStore.getState().setUsersTypingInRoom(roomId, userIds);
  }
};

function useChatActions(): ChatActions {
  return chatActions;
}

export type { ChatActions };
export { chatActions, useChatActions };
