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
import { setUserIsTyping, usersTypingByRoom } from './fake-db';

export class ChatActions {
  constructor(private readonly chatService: ChatService) {}

  sendMessage(
    payload: ChatSendPayload,
    ctx: HandlerContext
  ): ChatMessageBroadcastPayload {
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

  editMessage(
    payload: ChatEditPayload,
    ctx: HandlerContext
  ): ChatMessageEditedPayload & { roomId: string } {
    console.log('[ChatActions] editMessage', {
      payload,
      userId: ctx.userId,
      username: ctx.username,
    });

    const existing = this.chatService.getMessage(payload.messageId);
    const roomId = existing?.roomId ?? 'unknown-room';

    if (existing) {
      this.chatService.updateMessage(payload.messageId, payload.newText);
    }

    return {
      roomId,
      messageId: payload.messageId,
      newText: payload.newText,
      editedBy: ctx.username,
    };
  }

  setTypingState(
    payload: ChatTypingStatePayload,
    ctx: HandlerContext
  ): ChatTypingBroadcastPayload {
    console.log('[ChatActions] setTypingState', {
      payload,
      userId: ctx.userId,
      username: ctx.username,
    });

    // Update the fake-db with the typing state
    setUserIsTyping(payload.roomId, ctx.userId, payload.isTyping);

    // Return the aggregated list of all users currently typing in this room
    const typingUsers = usersTypingByRoom[payload.roomId];
    const userIds = typingUsers ? Array.from(typingUsers) : [];

    return {
      roomId: payload.roomId,
      userIds,
    };
  }
}
