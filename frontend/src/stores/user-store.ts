import { create } from 'zustand';

type UserState = {
  userId: string | null;
  username: string | null;
  setUser: (userId: string, username: string) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  username: null,
  setUser: (userId, username) => set({ userId, username }),
  clearUser: () => set({ userId: null, username: null }),
}));
