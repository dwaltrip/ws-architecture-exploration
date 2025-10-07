import type {
  ChatEditPayload,
  ChatMessageBroadcastPayload,
  ChatMessageEditedPayload,
  ChatSendPayload,
  ChatTypingBroadcastPayload,
  ChatTypingStatePayload,
} from '../../../../common/src';
import { ChatMessageBuilders } from './message-builders';
import { chatStore } from './store-singleton';
import { wsBridge } from '../../ws/bridge';
import * as userStore from '../../db/user-store.js';

type UserContext = { userId: string };

export const chatActions = {
  sendMessage(payload: ChatSendPayload, ctx?: UserContext): ChatMessageBroadcastPayload {
    console.log('[chatActions] sendMessage', { payload, ctx });

    const user = ctx?.userId ? userStore.getUser(ctx.userId) : undefined;
    const text = payload.text.trim() || 'Message text missing';
    const message: ChatMessageBroadcastPayload = {
      id: `msg-${Date.now()}`,
      roomId: payload.roomId,
      text,
      userId: ctx?.userId ?? 'unknown-user',
      username: user?.username ?? 'anonymous-user',
      timestamp: Date.now(),
    };

    chatStore.save(message);
    wsBridge.broadcastToRoom(message.roomId, ChatMessageBuilders.message(message));
    return message;
  },

  editMessage(payload: ChatEditPayload, ctx?: UserContext): ChatMessageEditedPayload & { roomId: string } {
    console.log('[chatActions] editMessage', { payload, ctx });

    const user = ctx?.userId ? userStore.getUser(ctx.userId) : undefined;
    const existing = chatStore.find(payload.messageId);
    const roomId = existing?.roomId ?? 'unknown-room';

    if (existing) {
      chatStore.update(payload.messageId, { text: payload.newText });
    }

    const editPayload = {
      roomId,
      messageId: payload.messageId,
      newText: payload.newText,
      editedBy: user?.username ?? 'anonymous-user',
    };

    wsBridge.broadcastToRoom(roomId, ChatMessageBuilders.edited({
      messageId: editPayload.messageId,
      newText: editPayload.newText,
      editedBy: editPayload.editedBy,
    }));

    return editPayload;
  },

  setTypingState(payload: ChatTypingStatePayload, ctx?: UserContext): ChatTypingBroadcastPayload {
    console.log('[chatActions] setTypingState', { payload, ctx });

    if (ctx?.userId) {
      chatStore.setTyping(payload.roomId, ctx.userId, payload.isTyping);
    }

    const typingUsers = chatStore.getTyping(payload.roomId);
    const typingBroadcast: ChatTypingBroadcastPayload = {
      roomId: payload.roomId,
      userIds: Array.from(typingUsers),
    };

    const opts = ctx?.userId ? { excludeUserId: ctx.userId } : undefined;

    wsBridge.broadcastToRoom(
      payload.roomId,
      ChatMessageBuilders.typing(typingBroadcast),
      opts,
    );

    return typingBroadcast;
  },
};
