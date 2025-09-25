import type { WSClient } from '../ws';
import { ChatClientActions } from './actions';

export function registerChatHandlers(client: WSClient, actions: ChatClientActions) {
  const unsubscribes = [
    client.on('chat:message', (payload) => actions.handleMessage(payload)),
    client.on('chat:edited', (payload) => actions.handleEdited(payload)),
    client.on('chat:typing', (payload) => actions.handleTyping(payload)),
  ];

  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  };
}
