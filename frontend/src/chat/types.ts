import type { ChatMessage } from "../../../common/src/types/db";

interface ChatActions {
  sendMessage: (roomId: string, text: string) => void;
  // TODO: this ChatMessage type needs to be more thought out.. not helping rightnow..
  addReceivedMessage: (chatMsg: ChatMessage) => void;
  joinRoom: (roomId: string) => void;
  // updateIsTypingStatus: (roomId: string, userId: string, isTyping: boolean) => void;
}

export type { ChatActions };

