import { create } from 'zustand';

import { areSetsEqual } from '../../../common/src/utils/set-utils';
import type { ChatRoomId, User } from '../../../common/src/types/db';

interface SystemState {
  usersByRoom: Record<ChatRoomId, User[]>

  actions: {
    updateUsersForRoom: (roomId: ChatRoomId, users: User[]) => void;
  },
}

const useSystemStore = create<SystemState>((set) => ({
  usersByRoom: {},

  actions: {
    updateUsersForRoom: (roomId, users) => set((state) => {
      const currentUsers = state.usersByRoom[roomId] || [];
      const noChange = areSetsEqual(
        new Set(users.map(u => u.id)),
        new Set(currentUsers.map(u => u.id)),
      );
      if (noChange) {
        return {};
      }
      return {
        usersByRoom: {
          ...state.usersByRoom,
          [roomId]: users,
        }
      };
    }),
  },
}));

const systemStore = useSystemStore;

function getSystemStore(): typeof systemStore {
  return systemStore;
}

// --------- selectors ---------

// Has to be the same object every time to avoid unnecessary re-renders
const EMPTY_SET: User[] = [];

function selectUsersInRoom(roomId: ChatRoomId) {
  return (state: SystemState): User[] => {
    const users = state.usersByRoom[roomId];
    if (!users) {
      console.debug(`Room ID ${roomId} not found in usersByRoom map`);
      return EMPTY_SET;
    }
    return users;
  };
}

// -----------------------------

export { useSystemStore, systemStore, getSystemStore, selectUsersInRoom };
