import type {
  ChatServerMessage,
  ChatServerPayloadMap,
} from '../../../../common/src';

function createChatMessageBuilder<TType extends keyof ChatServerPayloadMap & string>(
  type: TType
): (
  payload: ChatServerPayloadMap[TType]
) => Extract<ChatServerMessage, { type: TType }> {
  return (payload) =>
    ({
      type,
      payload,
    } as Extract<ChatServerMessage, { type: TType }>);
}

export const ChatMessageBuilders = {
  message: createChatMessageBuilder('chat:message'),
  edited: createChatMessageBuilder('chat:edited'),
  typing: createChatMessageBuilder('chat:is-typing-in-room'),
};
