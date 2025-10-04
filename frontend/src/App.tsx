import { useEffect } from 'react';
import { ChatContainer } from './pages/chat-page/chat-container';
import { initializeWsApp } from './ws/bootstrap';

function App() {
  useEffect(() => {
    initializeWsApp();
    // No cleanup - app-level singleton lifecycle
  }, []);

  return <ChatContainer />;
}

export { App };
