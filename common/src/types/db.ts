
type UserId = string;
type ChatMessageId = string;
type ChatRoomId = string;

interface User {
  id: UserId;
  username: string;
}

interface ChatMessage {
  id: ChatMessageId;
  content: string;
  userId: UserId;
}

interface ChatRoom {
  id: ChatRoomId;
  name: string;
}

export type {
  UserId, ChatMessageId, ChatRoomId,
  User, ChatMessage, ChatRoom,
};
