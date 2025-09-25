
function addNewMessage(text: string, roomId: string, userId: string) {
  console.log('[ChatClientActions] message received', { text, roomId, userId });
}

function updateMessageWithEdits(messageId: string, newText: string) {
  console.log('[ChatClientActions] message edited', { messageId, newText });
}

function updateIsTypingStatus(roomId: string, userId: string, isTyping: boolean) {
  console.log('[ChatClientActions] typing status', { roomId, userId, isTyping });
}

export { addNewMessage, updateMessageWithEdits, updateIsTypingStatus };
