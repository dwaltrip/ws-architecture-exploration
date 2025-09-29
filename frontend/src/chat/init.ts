import { connectWsClient } from '../ws/create-client';
import { registerChatHandlers } from './handlers';

function initChatDomain(): void {
  registerChatHandlers();
  connectWsClient();
}

export { initChatDomain };
