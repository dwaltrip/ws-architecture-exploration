import { ChatMessageBroadcastPayload, ChatTypingBroadcastPayload } from "../../../../common/src";
import { wsBridge } from "../../ws/bridge";

const chatWsEffects = {
  broadcastNewMessage(message: ChatMessageBroadcastPayload) {
    wsBridge.broadcastToRoom(message.roomId, {
      type: 'chat:message',
      payload: message,
    });
  },

  broadcastTypingState(payload: ChatTypingBroadcastPayload, currentUserId: string) {
    wsBridge.broadcastToRoom(
      payload.roomId,
      { type: 'chat:is-typing-in-room', payload },
      { excludeUserId: currentUserId },
    );
  },
};

export { chatWsEffects };
