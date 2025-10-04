import type { ChatActions } from "./types";

import { chatStore } from "./chat-store";
import { systemWsEffects } from "../system";
import { chatWsEffects } from "./ws-effects";

const MAIN_LOBBY = { id: 'general', name: 'General' };

const chatActions: ChatActions = {
  sendMessage(roomId: string, text: string) {
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
};

export type { ChatActions };
export { chatActions };
