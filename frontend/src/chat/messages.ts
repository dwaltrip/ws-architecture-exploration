import type { ChatClientMessage } from '../../../common/src';

export const chatMessages = {
  send: (
    text: string,
    roomId: string
  ): Extract<ChatClientMessage, { type: 'chat:send' }> => ({
    type: 'chat:send',
    payload: { text, roomId },
  }),
  edit: (
    messageId: string,
    newText: string
  ): Extract<ChatClientMessage, { type: 'chat:edit' }> => ({
    type: 'chat:edit',
    payload: { messageId, newText },
  }),
  typing: (
    roomId: string,
    isTyping: boolean
  ): Extract<ChatClientMessage, { type: 'chat:typing' }> => ({
    type: 'chat:typing',
    payload: { roomId, isTyping },
  }),
} as const;
