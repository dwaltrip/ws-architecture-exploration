  import { useEffect, useMemo, useState } from 'react';

  import { getOrCreateExampleClient } from './ws';

function App() {
  const [messages, setMessages] = useState<string[]>([]);

  const client = useMemo(() => getOrCreateExampleClient('ws://localhost:3000'), []);

  useEffect(() => {
    const unsubscribe = client.subscribe('chat:message', (payload) => {
      setMessages((prev) => [...prev, `${payload.username}: ${payload.text}`]);
    });

    client.joinRoom('lobby');

    return () => {
      unsubscribe();
      client.leaveRoom('lobby');
      client.dispose();
    };
  }, [client]);

  return (
    <div>
      <button onClick={() => client.sendChat('lobby', 'Hello from UI!')}>
        Send demo chat
      </button>
      <pre>{messages.join('\n')}</pre>
    </div>
  );
}

export { App}
