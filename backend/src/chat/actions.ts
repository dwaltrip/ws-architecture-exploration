import type {
  ChatEditPayload,
  ChatMessageBroadcastPayload,
  ChatSendPayload,
  ChatTypingBroadcastPayload,
  ChatTypingStatePayload,
} from '../../../common/src';
import { ActionError } from '../ws/errors';
import type { HandlerContext } from '../ws/types';
import { ChatService } from './service';

export class ChatActions {
  constructor(private readonly chatService: ChatService) {}

  async sendMessage(
    payload: ChatSendPayload,
    ctx: HandlerContext
  ): Promise<ChatMessageBroadcastPayload> {
    if (payload.text.trim().length === 0) {
      throw new ActionError('MESSAGE_EMPTY', 'Messages must contain text');
    }

    if (payload.text.length > 1000) {
      throw new ActionError('MESSAGE_TOO_LONG', 'Messages must be under 1000 characters');
    }

    if (!(await ctx.isInRoom(payload.roomId))) {
      throw new ActionError('NOT_IN_ROOM', 'You must join a room before sending messages');
    }

    return this.chatService.saveMessage({
      text: payload.text,
      roomId: payload.roomId,
      userId: ctx.userId,
      username: ctx.username,
    });
  }

  async editMessage(
    payload: ChatEditPayload,
    ctx: HandlerContext
  ): Promise<ChatMessageBroadcastPayload> {
    const message = await this.chatService.getMessage(payload.messageId);

    if (!message) {
      throw new ActionError('MESSAGE_NOT_FOUND', 'Message not found');
    }

    if (message.userId !== ctx.userId) {
      throw new ActionError('FORBIDDEN', 'You can only edit your own messages');
    }

    const updated = await this.chatService.updateMessage(payload.messageId, payload.newText);

    if (!updated) {
      throw new ActionError('MESSAGE_NOT_FOUND', 'Message not found');
    }

    return updated;
  }

  async setTypingState(
    payload: ChatTypingStatePayload,
    ctx: HandlerContext
  ): Promise<ChatTypingBroadcastPayload> {
    return {
      roomId: payload.roomId,
      userId: ctx.userId,
      username: ctx.username,
      isTyping: payload.isTyping,
    };
  }
}
