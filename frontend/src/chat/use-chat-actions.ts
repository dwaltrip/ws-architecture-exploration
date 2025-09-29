import type { ChatActions } from "./types";
import { chatActions } from "./actions";

function useChatActions(): ChatActions {
  return chatActions;
}

export { useChatActions };
