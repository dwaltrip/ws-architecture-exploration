import { useState } from 'react';

import { useInitializeWsApp } from './ws';
import { ChatContainer } from './pages/chat-page/chat-container';
import { GamePage } from './pages/game-page/game-page';

type Tab = 'chat' | 'game';

function App() {
  const isInitialized = useInitializeWsApp();
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <nav style={{ padding: '5px', borderBottom: '1px solid #ccc' }}>
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            marginRight: '10px',
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
