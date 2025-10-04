import { ChatContainer } from './pages/chat-page/chat-container';
import { useInitializeWsApp } from './ws';

function App() {
  const isInitialized = useInitializeWsApp();

  if (!isInitialized) {
    return <div>Loading...</div>;
  }
  return <ChatContainer />;
}

export { App };
