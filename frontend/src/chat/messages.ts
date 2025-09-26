import type { ChatClientMessage } from '../../../common/src';

function createSendMessage(
  text: string,
  roomId: string
): Extract<ChatClientMessage, { type: 'chat:send' }> {
  return {
    type: 'chat:send',
    payload: { text, roomId },
  };
}

function createEditMessage(
  messageId: string,
  newText: string
): Extract<ChatClientMessage, { type: 'chat:edit' }> {
  return {
    type: 'chat:edit',
    payload: { messageId, newText },
  };
}

function createTypingMessage(
  roomId: string,
  isTyping: boolean
): Extract<ChatClientMessage, { type: 'chat:typing' }> {
  return {
    type: 'chat:typing',
    payload: { roomId, isTyping },
  };
}

export {
  createSendMessage,
  createEditMessage,
  createTypingMessage,
};
