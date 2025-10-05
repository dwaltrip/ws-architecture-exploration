import { useEffect, useState } from "react";

import { useChatStore } from "../../chat/chat-store";
import { useSystemStore, selectUsersInRoom } from "../../system/system-store";
import { useChatActions } from "../../chat/actions";
import { useTypingDetection } from "../../chat/use-typing-detection";
import { TimerControls } from "../../timer/timer-controls";


function ChatContainer() {
  const [newMessageText, setNewMessageText] = useState('');

  const { joinGeneralRoom, sendMessage } = useChatActions();

  const {
    messages,
    currentRoom,
    availableRooms,
    usersTypingByRoom,
  } = useChatStore();

  const usersInCurrentRoom = Array.from(useSystemStore(selectUsersInRoom(currentRoom?.id || '')));
  console.log('usersInCurrentRoom', usersInCurrentRoom);

  const { handleInputChange: handleTyping, stopTyping } = useTypingDetection({
    roomId: currentRoom?.id || null,
  });

  // Get typing indicators for current room
  const typingUserIds = currentRoom ? (usersTypingByRoom[currentRoom.id] || []) : [];
  const typingUsers = usersInCurrentRoom.filter(user => typingUserIds.includes(user.id));
  const typingText = typingUsers.length > 0
    ? typingUsers.length === 1
      ? `${typingUsers[0].name} is typing...`
      : typingUsers.length === 2
        ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
        : `${typingUsers[0].name}, ${typingUsers[1].name}, and ${typingUsers.length - 2} other${typingUsers.length - 2 > 1 ? 's' : ''} are typing...`
    : '';

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
          {messages.map((msg) => (
            <div key={msg.id} className="chat-message">
              <strong>{msg.user.name}:</strong> {msg.content}
            </div>
          ))}
        </div>

        {typingText && (
          <div className="typing-indicator" style={{ padding: '8px', fontStyle: 'italic', color: '#666' }}>
            {typingText}
          </div>
        )}

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
          {/* TODO: use actual Users w/ usernames */}
          {usersInCurrentRoom.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>

        <h4>Room Timer</h4>
        <TimerControls roomId={currentRoom?.id || null} />
      </div>
    </div>
  );
}

export { ChatContainer}
