import type { User } from "../../../../common/src/types/db";

interface TypingIndicatorsProps {
  users: User[]
}

function TypingIndicators({ users }: TypingIndicatorsProps) {
  const typingText = users.length > 0
    ? users.length === 1
      ? `${users[0].username} is typing...`
      : users.length === 2
        ? `${users[0].username} and ${users[1].username} are typing...`
        : `${users[0].username}, ${users[1].username}, and ${users.length - 2} other${users.length - 2 > 1 ? 's' : ''} are typing...`
    : '';
        
  return (
    typingText && (
      <div className="typing-indicator" style={{ padding: '8px', fontStyle: 'italic', color: '#666' }}>
        {typingText}
      </div>
    )
  );
}

export { TypingIndicators};
