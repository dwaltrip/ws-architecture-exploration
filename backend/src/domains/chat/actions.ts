import type {
  ChatMessageBroadcastPayload,
  ChatSendPayload,
  ChatTypingBroadcastPayload,
  ChatTypingStatePayload,
} from '../../../../common/src';
import { chatStore } from './store-singleton';
import * as userStore from '../../db/user-store.js';
import { chatWsEffects } from './ws-effects';

type UserContext = { userId: string };

export const chatActions = {
  sendMessage(payload: ChatSendPayload, ctx: UserContext) {
    console.log('[chatActions] sendMessage', { payload, ctx });

    const user = userStore.getUser(ctx.userId);
    const text = payload.text.trim() || 'Message text missing';
    const message: ChatMessageBroadcastPayload = {
      id: `msg-${Date.now()}`,
      roomId: payload.roomId,
      text,
      userId: ctx.userId || 'unknown-user',
      username: user?.username ?? 'anonymous-user',
      timestamp: Date.now(),
    };

    chatStore.save(message);
    chatWsEffects.broadcastNewMessage(message);
  },

  setTypingState(payload: ChatTypingStatePayload, ctx: UserContext) {
    chatStore.setTyping(payload.roomId, ctx.userId, payload.isTyping);

    const typingUsers = chatStore.getTyping(payload.roomId);
    const typingBroadcast: ChatTypingBroadcastPayload = {
      roomId: payload.roomId,
      userIds: Array.from(typingUsers),
    };

    chatWsEffects.broadcastTypingState(
      typingBroadcast,
      ctx.userId
    );
  },
};
