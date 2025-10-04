import { useEffect, useState } from "react";

import { useChatStore } from "../../chat/chat-store";
import { useSystemStore, selectUsersInRoom } from "../../system/system-store";
import { useChatActions } from "../../chat/use-chat-actions";


function ChatContainer() {
  const [newMessageText, setNewMessageText] = useState('');

  const { joinGeneralRoom, sendMessage } = useChatActions();

  const {
    messages,
    currentRoom,
    availableRooms,
    // usersWhoAreTyping,
  } = useChatStore();

  const usersInCurrentRoom = Array.from(useSystemStore(selectUsersInRoom(currentRoom?.id || '')));
  console.log('usersInCurrentRoom', usersInCurrentRoom);

  useEffect(() => {
    if (!currentRoom) {
      console.log('No current room, joining general');
      joinGeneralRoom();
    }
  }, [currentRoom, joinGeneralRoom]);

  const postMessage = () => {
    console.log('Posting message', { newMessageText, currentRoom });
    sendMessage(currentRoom?.id || '', newMessageText);
    setNewMessageText('');
  }
  const isSendDisabled = !newMessageText.trim() || !currentRoom;

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
            >
              {room.name}
            </li>
          ))}
        </ul>

        <h4>Users</h4>
        <ul>
          {/* TODO: use actual Users w/ usernames */}
          {usersInCurrentRoom.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export { ChatContainer}
