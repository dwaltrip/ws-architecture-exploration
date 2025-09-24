import type { ChatMessageBroadcastPayload } from '../../../common/src';

interface SaveMessageInput {
  text: string;
  roomId: string;
  userId: string;
  username: string;
}

export class ChatService {
  private messages = new Map<string, ChatMessageBroadcastPayload>();
  private sequence = 0;

  async saveMessage(input: SaveMessageInput): Promise<ChatMessageBroadcastPayload> {
    const id = `msg-${++this.sequence}`;
    const message: ChatMessageBroadcastPayload = {
      id,
      text: input.text,
      userId: input.userId,
      username: input.username,
      roomId: input.roomId,
      timestamp: Date.now(),
    };

    this.messages.set(id, message);
    return message;
  }

  async getMessage(id: string): Promise<ChatMessageBroadcastPayload | undefined> {
    return this.messages.get(id);
  }

  async updateMessage(
    id: string,
    newText: string
  ): Promise<ChatMessageBroadcastPayload | undefined> {
    const existing = this.messages.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: ChatMessageBroadcastPayload = {
      ...existing,
      text: newText,
    };

    this.messages.set(id, updated);
    return updated;
  }
}
