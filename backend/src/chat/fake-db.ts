import { ChatRoomId, UserId } from "../../../common/src/types/db";

const usersTypingByRoom: Record<ChatRoomId, Set<UserId>> = {};

function setUserIsTyping(roomId: ChatRoomId, userId: UserId, isTyping: boolean) {
  if (!usersTypingByRoom[roomId]) {
    usersTypingByRoom[roomId] = new Set();
  }
  if (isTyping) {
    usersTypingByRoom[roomId].add(userId);
  } else {
    usersTypingByRoom[roomId].delete(userId);
  }
}

export { setUserIsTyping, usersTypingByRoom }
