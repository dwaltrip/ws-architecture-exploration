import type {
  ChatMessageBroadcastPayload,
  ChatSendPayload,
  ChatTypingBroadcastPayload,
  ChatTypingStatePayload,
} from '../../../../common/src';
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
    wsBridge.broadcastToRoom(message.roomId, {
      type: 'chat:message',
      payload: message,
    });
    return message;
  },

  setTypingState(payload: ChatTypingStatePayload, ctx?: UserContext): ChatTypingBroadcastPayload {
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
      { type: 'chat:is-typing-in-room', payload: typingBroadcast },
      opts,
    );

    return typingBroadcast;
  },
};
