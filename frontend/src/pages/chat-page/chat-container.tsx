import { useEffect, useState } from "react";

import { useChatStore } from "../../chat/chat-store";
import { useSystemStore, selectUsersInRoom } from "../../system/system-store";
import { useChatActions } from "../../chat/actions";
import { useTypingDetection } from "../../chat/use-typing-detection";
import { TimerControls } from "../../timer/timer-controls";
import { TypingIndicators } from "./typing-indicators";

function ChatContainer() {
  const [newMessageText, setNewMessageText] = useState('');
  const {
    messages,
    currentRoom,
    availableRooms,
    usersTypingByRoom,
  } = useChatStore();
  const { joinGeneralRoom, sendMessage } = useChatActions();

  const usersInRoom = Array.from(
    useSystemStore(selectUsersInRoom(currentRoom?.id || '')),
  );
  const { handleInputChange: handleTyping, stopTyping } = useTypingDetection({
    roomId: currentRoom?.id || null,
  });

  // Get users who are currently typing in this room
  const typingUserIds = currentRoom ? (usersTypingByRoom[currentRoom.id] || []) : [];
  const typingUsers = usersInRoom.filter(user => typingUserIds.includes(user.id));

  useEffect(() => {
    if (!currentRoom) {
      console.log('No current room, joining general');
      joinGeneralRoom();
    }
  }, [currentRoom, joinGeneralRoom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setNewMessageText(text);
    handleTyping(text);
  };

  const postMessage = () => {
    console.log('Posting message', { newMessageText, currentRoom });
    sendMessage(currentRoom?.id || '', newMessageText);
    setNewMessageText('');
    stopTyping();
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
          {messages.map((msg) => {
            const user = usersInRoom.find(u => u.id === msg.userId);
            const username = user?.username || 'Unknown User';
            return (
              <div key={msg.id} className="chat-message">
                <strong>{username}:</strong> {msg.content}
              </div>
            );
          })}
        </div>

        <TypingIndicators users={typingUsers} />

        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessageText}
            onChange={handleInputChange}
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
          {usersInRoom.map((user) => (
            <li key={user.id}>{user.username}</li>
          ))}
        </ul>

        <h4>Room Timer</h4>
        <TimerControls roomId={currentRoom?.id || null} />
      </div>
    </div>
  );
}

export { ChatContainer}
