import { getWsClient } from '../ws/create-client';

import { createSendMessage } from './messages';

interface ChatWsEffects {
  postNewMessage(roomId: string, text: string): void;
}

const chatWsEffects: ChatWsEffects = {
  postNewMessage(roomId: string, text: string) {
    if (!text.trim()) {
      return;
    }

    getWsClient().send(createSendMessage(text, roomId));
  },
};

export type { ChatWsEffects };
export { chatWsEffects };
