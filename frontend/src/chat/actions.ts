import type {
  ChatMessageBroadcastPayload,
  ChatMessageEditedPayload,
  ChatTypingBroadcastPayload,
} from '../../../common/src';

export class ChatClientActions {
  handleMessage(payload: ChatMessageBroadcastPayload) {
    console.log('[ChatClientActions] message received', payload);
  }

  handleEdited(payload: ChatMessageEditedPayload) {
    console.log('[ChatClientActions] message edited', payload);
  }

  handleTyping(payload: ChatTypingBroadcastPayload) {
    console.log('[ChatClientActions] typing state', payload);
  }
}
