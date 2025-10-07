import { ChatContainer } from './pages/chat-page/chat-container';
import { GamePage } from './pages/game-page/game-page';
import { useInitializeWsApp } from './ws';
import { useState } from 'react';

type Tab = 'chat' | 'game';

function App() {
  const isInitialized = useInitializeWsApp();
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            marginRight: '1rem',
            fontWeight: activeTab === 'chat' ? 'bold' : 'normal',
          }}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('game')}
          style={{
            fontWeight: activeTab === 'game' ? 'bold' : 'normal',
          }}
        >
          Game
        </button>
      </nav>
      {activeTab === 'chat' && <ChatContainer />}
      {activeTab === 'game' && <GamePage />}
    </div>
  );
}

export { App };
