import { create } from 'zustand';

import { areSetsEqual } from '../../../common/src/utils/set-utils';
import type { ChatRoom, ChatRoomId, UserId } from '../../../common/src/types/db';

interface SystemState {
  usersByRoom: Record<ChatRoomId, Set<UserId>>;

  actions: {
    updateUsersForRoom: (roomId: ChatRoomId, userIds: UserId[]) => void;
  },
}

const useSystemStore = create<SystemState>((set) => ({
  usersByRoom: {},

  actions: {
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
  },
}));

const systemStore = useSystemStore;

function getSystemStore(): typeof systemStore {
  return systemStore;
}

// --------- selectors ---------

function selectUsersInRoom(roomId: ChatRoomId) {
  return (state: SystemState): Set<UserId> => {
    const users = state.usersByRoom[roomId];
    if (!users) {
      console.warn(`Roomm ID ${roomId} not found in usersByRoom map`);
    }
    return users;
  };
}

// -----------------------------

export { useSystemStore, systemStore, getSystemStore, selectUsersInRoom };
