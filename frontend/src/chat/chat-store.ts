import { create } from 'zustand';

import type { ChatMessage, ChatRoom, ChatRoomId, UserId } from '../../../common/src/types/db';

interface ChatState {
  messages: ChatMessage[];
  currentRoom: ChatRoom | null;
  availableRooms: ChatRoom[];
  usersTypingByRoom: Record<ChatRoomId, UserId[]>;

  addMessage: (message: ChatMessage) => void;
  setCurrentRoom: (room: ChatRoom) => void;
  setAvailableRooms: (rooms: ChatRoom[]) => void;
  setUsersTypingInRoom: (roomId: ChatRoomId, userIds: UserId[]) => void;
}

const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentRoom: null,
  availableRooms: [],
  usersTypingByRoom: {},

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),

  setAvailableRooms: (rooms) => set({ availableRooms: rooms }),

  setUsersTypingInRoom: (roomId, userIds) => set((state) => ({
    usersTypingByRoom: { ...state.usersTypingByRoom, [roomId]: userIds }
  })),
}));

const chatStore = useChatStore;

function getChatStore(): typeof chatStore {
  return chatStore;
}

export { useChatStore, chatStore, getChatStore };
