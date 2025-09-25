import type {
  ChatEditPayload,
  ChatMessageBroadcastPayload,
  ChatMessageEditedPayload,
  ChatSendPayload,
  ChatTypingBroadcastPayload,
  ChatTypingStatePayload,
} from '../../../common/src';
import type { HandlerContext } from '../ws/types';
import { ChatService } from './service';

export class ChatActions {
  constructor(private readonly chatService: ChatService) {}

  async sendMessage(
    payload: ChatSendPayload,
    ctx: HandlerContext
  ): Promise<ChatMessageBroadcastPayload> {
    console.log('[ChatActions] sendMessage', {
      payload,
      userId: ctx.userId,
      username: ctx.username,
    });

    const text = payload.text.trim() || 'Message text missing';

    return this.chatService.saveMessage({
      text,
      roomId: payload.roomId,
      userId: ctx.userId,
      username: ctx.username,
    });
  }

  async editMessage(
    payload: ChatEditPayload,
    ctx: HandlerContext
  ): Promise<ChatMessageEditedPayload & { roomId: string }> {
    console.log('[ChatActions] editMessage', {
      payload,
      userId: ctx.userId,
      username: ctx.username,
    });

    const existing = await this.chatService.getMessage(payload.messageId);
    const roomId = existing?.roomId ?? 'unknown-room';

    if (existing) {
      await this.chatService.updateMessage(payload.messageId, payload.newText);
    }

    return {
      roomId,
      messageId: payload.messageId,
      newText: payload.newText,
      editedBy: ctx.username,
    };
  }

  async setTypingState(
    payload: ChatTypingStatePayload,
    ctx: HandlerContext
  ): Promise<ChatTypingBroadcastPayload> {
    console.log('[ChatActions] setTypingState', {
      payload,
      userId: ctx.userId,
      username: ctx.username,
    });

    return {
      roomId: payload.roomId,
      userId: ctx.userId,
      username: ctx.username,
      isTyping: payload.isTyping,
    };
  }
}
