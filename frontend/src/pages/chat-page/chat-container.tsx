import { useEffect, useState } from "react";

import type { User } from "../../../../common/src/types/db";
import { useChatStore } from "../../chat/chat-store";
import { useChatActions } from "../../chat/use-chat-actions";

const DUMMY_USERS: User[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Charlie' },
];

function ChatContainer() {
  const [newMessageText, setNewMessageText] = useState('');

  const { joinRoom, sendMessage } = useChatActions();

  const {
    messages,
    currentRoom,
    availableRooms,
    // usersWhoAreTyping,

    setCurrentRoom,
  } = useChatStore();

  const usersInCurrentRoom: User[] = DUMMY_USERS; // TODO: derive from store

  useEffect(() => {
    if (!currentRoom) {
      console.log('No current room, joining general');
      joinRoom('general');
      setCurrentRoom({ id: 'general', name: 'General' });
    }
  }, [currentRoom, setCurrentRoom]);

  const postMessage = () => {
    console.log('Posting message', { newMessageText, currentRoom });
    sendMessage(currentRoom?.id || '', newMessageText);
    setNewMessageText('');
  }
  const isSendDisabled = !newMessageText.trim() || !currentRoom;
  console.log('isSendDisabled', isSendDisabled);

  return (
    <div className="chat-container">

      <main>
        <div className="chat-header">
          <h2>Chat</h2>
          <p>Room: {currentRoom ? currentRoom.name : 'None'}</p>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className="chat-message">
              <strong>{msg.user.name}:</strong> {msg.content}
            </div>
          ))}
        </div>

        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
          />

          <button 
            onClick={() => postMessage()}
            disabled={isSendDisabled}
          >
            Send
          </button>
        </div>
      </main>

      <div className="chat-sidebar">
        <h4>Rooms</h4>
        <ul>
          {availableRooms.map((room) => (
            <li
              key={room.id}
              className={currentRoom?.id === room.id ? 'active' : ''}
              onClick={() => joinRoom(room.id)}
            >
              {room.name}
            </li>
          ))}
        </ul>

        <h4>Users</h4>
        <ul>
          {usersInCurrentRoom.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export { ChatContainer}
