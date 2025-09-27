import { create } from 'zustand';

import type { ChatMessage, ChatRoom, UserId } from '../../../../common/src/types/db';

interface ChatState {
  messages: ChatMessage[];
  currentRoom: ChatRoom | null;
  availableRooms: ChatRoom[];
  usersWhoAreTyping: UserId[];

  addMessage: (message: ChatMessage) => void;
  setCurrentRoom: (room: ChatRoom) => void;
  setAvailableRooms: (rooms: ChatRoom[]) => void;
  setUserTypingStatus: (userId: UserId, isTyping: boolean) => void;
}

// const useChatStore = create<ChatState>((set, get) => ({
const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentRoom: null,
  availableRooms: [],
  usersWhoAreTyping: [],

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),

  setAvailableRooms: (rooms) => set({ availableRooms: rooms }),

  setUserTypingStatus: (userId, isTyping) => {
    set((state) => {
      const isAlreadyTyping = state.usersWhoAreTyping.includes(userId);
      if (isTyping && !isAlreadyTyping) {
        return {
          usersWhoAreTyping: [...state.usersWhoAreTyping, userId]
        };
      }
      else if (!isTyping && isAlreadyTyping) {
        return {
          usersWhoAreTyping: state.usersWhoAreTyping.filter((id) => id !== userId)
        };
      }
      return {};
    });
  },
}));

const chatStore = useChatStore;

function getChatStore(): typeof chatStore {
  return chatStore;
}

export { useChatStore, chatStore, getChatStore };
