import { create } from 'zustand';

import { areSetsEqual } from '../../../common/src/utils/set-utils';
import type { ChatMessage, ChatRoom, ChatRoomId, UserId } from '../../../common/src/types/db';

interface ChatState {
  messages: ChatMessage[];
  currentRoom: ChatRoom | null;
  availableRooms: ChatRoom[];
  usersWhoAreTyping: UserId[];

  usersByRoom: Record<ChatRoomId, Set<UserId>>;

  addMessage: (message: ChatMessage) => void;
  setCurrentRoom: (room: ChatRoom) => void;
  setAvailableRooms: (rooms: ChatRoom[]) => void;
  setUserTypingStatus: (userId: UserId, isTyping: boolean) => void;
  updateUsersForRoom: (roomId: ChatRoomId, userIds: UserId[]) => void;
}

// const useChatStore = create<ChatState>((set, get) => ({
const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentRoom: null,
  availableRooms: [],
  usersWhoAreTyping: [],
  usersByRoom: {},

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

  updateUsersForRoom: (roomId, userIds) => set((state) => {
    const newUsers = new Set(userIds);
    const currentUsers = state.usersByRoom[roomId] || new Set<UserId>();
    if (areSetsEqual(newUsers, currentUsers)) {
      return {};
    }
    return {
      usersByRoom: {
        ...state.usersByRoom,
        [roomId]: newUsers
      }
    };
  }),
}));

const chatStore = useChatStore;

function getChatStore(): typeof chatStore {
  return chatStore;
}

export { useChatStore, chatStore, getChatStore };
