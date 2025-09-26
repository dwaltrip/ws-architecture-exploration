import type { ClientMessage, ServerMessage } from '../../../common/src';
import { createSendMessage } from './messages';
import type { WSClient } from '../ws/client';

type ChatWsClient = WSClient<ServerMessage, ClientMessage>;

function createChatWsEffects(client: ChatWsClient) {
  return {
    postNewMessage(roomId: string, text: string) {
      client.send(createSendMessage(text, roomId));
    },
  } as const;
}

export { createChatWsEffects };
