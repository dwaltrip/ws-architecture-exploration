import type {
  SystemServerMessage,
  SystemServerPayloadMap,
} from '../../../../common/src';

function createSystemMessageBuilder<TType extends keyof SystemServerPayloadMap & string>(
  type: TType
): (
  payload: SystemServerPayloadMap[TType]
) => Extract<SystemServerMessage, { type: TType }> {
  return (payload) =>
    ({
      type,
      payload,
    } as Extract<SystemServerMessage, { type: TType }>);
}

export const SystemMessageBuilders = {
  usersForRoom: createSystemMessageBuilder('system:users-for-room'),
};
