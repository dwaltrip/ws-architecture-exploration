  import { useEffect, useMemo, useState } from 'react';

  import { createExampleClient } from './ws';

function App() {
  const [messages, setMessages] = useState<string[]>([]);

  const client = useMemo(() => createExampleClient('ws://localhost:3000'), []);

  useEffect(() => {
    const unsubscribe = client.subscribe('chat:message', (payload) => {
      setMessages((prev) => [...prev, `${payload.username}: ${payload.text}`]);
    });

    client.sendJoin('lobby');

    return () => {
      unsubscribe();
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
