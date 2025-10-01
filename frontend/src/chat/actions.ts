import type { ChatActions } from "./types";

import { chatStore } from "./chat-store";
import { systemWsEffects } from "../system";
import { chatWsEffects } from "./ws-effects";

const chatActions: ChatActions = {
  sendMessage(roomId: string, text: string) {
    chatWsEffects.postNewMessage(roomId, text);
  },

  addReceivedMessage(chatMsg) {
    console.log('[ChatClientActions] message received', chatMsg);
    chatStore.getState().addMessage(chatMsg);
  },

  joinRoom(roomId: string) {
    systemWsEffects.joinRoom(roomId);
  },
};

export type { ChatActions };
export { chatActions };
