import { ChatContainer } from './pages/chat-page/chat-container';
import { ChatProvider } from './chat/provider';

function App() {
  return (
    <ChatProvider>
      <ChatContainer />
    </ChatProvider>
  );
}

export { App };
