import type { User } from "../../../common/src/types/db";
import { systemStore } from "./system-store";

const systemActions = {
  setUsersForRoom: (roomId: string, users: User[]) => {
    const { updateUsersForRoom } = systemStore.getState().actions;
    updateUsersForRoom(roomId, users.map(u => u.id));
  }
};

export { systemActions };
