import {
  addNewMessage,
  updateMessageWithEdits,
  updateIsTypingStatus,
} from './actions';

// I think this would be something related the message / payload types in common
//  
type SomeSpecialTypeThing = any;
type AnotherSpecialTypeThing = any; 

// Idea 1
const ChatHandlers: Handler<SomeSpecialTypeThing> = {
  'chat:message': (payload) => {
    const { text, roomId, userId } = payload;
    addNewMessage(text, roomId, userId);
  },
  'chat:edited': (payload) => {
    const { messageId, newText } = payload;
    updateMessageWithEdits(messageId, newText);
  },
  'chat:typing': (payload) => {
    const { roomId, userId, isTyping } = payload;
    updateIsTypingStatus(roomId, userId, isTyping);
  },
};

// Idea 2: alternatively.. maybe a factory fn would make the types simpler??
const ChatHandlers = createHandlerMap<AnotherSpecialTypeThing>({
  'chat:message': (payload) => {
    const { text, roomId, userId } = payload;
    addNewMessage(text, roomId, userId);
  },
  'chat:edited': (payload) => {
    const { messageId, newText } = payload;
    updateMessageWithEdits(messageId, newText);
  },
  'chat:typing': (payload) => {
    const { roomId, userId, isTyping } = payload;
    updateIsTypingStatus(roomId, userId, isTyping);
  },
});

export { ChatHandlers };
