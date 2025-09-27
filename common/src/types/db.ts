
type UserId = string;
type ChatMessageId = string;
type ChatRoomId = string;

interface User {
  id: UserId;
  name: string;
}

interface ChatMessage {
  id: ChatMessageId;
  content: string;
  user: User
}

interface ChatRoom {
  id: ChatRoomId;
  name: string;
}

export type {
  UserId, ChatMessageId, ChatRoomId,
  User, ChatMessage, ChatRoom,
};
