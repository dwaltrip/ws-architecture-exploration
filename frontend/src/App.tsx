import { useEffect, useMemo, useState } from 'react';

import { createChatWsEffects } from './chat';
import { createSystemWsEffects } from './system';
import { getOrCreateWsClient } from './ws/create-client';

function App() {
  const [messages, setMessages] = useState<string[]>([]);

  const client = useMemo(() => getOrCreateWsClient(), []);
  const chatEffects = useMemo(() => createChatWsEffects(client), [client]);
  const systemEffects = useMemo(() => createSystemWsEffects(client), [client]);

  useEffect(() => {
    const unsubscribe = client.on('chat:message', (payload) => {
      setMessages((prev) => [...prev, `${payload.username}: ${payload.text}`]);
    });

    systemEffects.joinRoom('lobby');

    return () => {
      unsubscribe();
      systemEffects.leaveRoom('lobby');
      client.disconnect();
    };
  }, [client, systemEffects]);

  return (
    <div>
      <button onClick={() => chatEffects.postNewMessage('lobby', 'Hello from UI!')}>
        Send demo chat
      </button>
      <pre>{messages.join('\n')}</pre>
    </div>
  );
}

export { App };
