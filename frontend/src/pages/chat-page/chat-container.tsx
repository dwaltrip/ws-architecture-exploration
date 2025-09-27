import { useMemo, useState } from "react";

import { userChatStore  } from "./chat-store";
import { getOrCreateWsClient } from "../../ws/create-client";

function Chat() {
  const [newMessageText, setNewMessageText] = useState('');

  const client = useMemo(
    () => getOrCreateExampleClient('ws://localhost:3000'),
    []
  );

  const {
    messages,
    currentRoom,
    availableRooms,
    // usersWhoAreTyping,
  } = userChatStore();


  return (
    <div className="chat-container">

      <main>
        <div className="chat-header">
          <h2>Chat</h2>
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

          <button onClick={() => {
            post(newMessageText);
          }}>
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
              onClick={() => setCurrentRoom(room)}
            >
              {room.name}
            </li>
          ))}
        </ul>

        <h4>Users</h4>
        <ul>
          TODO: List users in current room
        </ul>
      </div>
    </div>
  );
}

