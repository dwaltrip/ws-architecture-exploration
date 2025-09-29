import { type PropsWithChildren, useEffect } from 'react';

import { initChatDomain } from './init';

interface ChatProviderProps {
  autoConnect?: boolean;
}

/*
TODO: add cleanup once we support tearing chat down.
  - disconnect the websocket (and maybe expose a pause/resume API)
  - unregister chat handlers or let the store noop if invoked afterward
  - consider making initChatDomain idempotent so repeated mounts stay safe
*/
function ChatProvider({ children, autoConnect = true }: PropsWithChildren<ChatProviderProps>) {
  useEffect(() => {
    if (!autoConnect) {
      return undefined;
    }

    initChatDomain();
    return undefined;
  }, [autoConnect]);

  return <>{children}</>;
}

export { ChatProvider };
