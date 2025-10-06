import type {
  TimerServerMessage,
  TimerServerPayloadMap,
} from '../../../../common/src';

function createTimerMessageBuilder<TType extends keyof TimerServerPayloadMap & string>(
  type: TType
): (
  payload: TimerServerPayloadMap[TType]
) => Extract<TimerServerMessage, { type: TType }> {
  return (payload) =>
    ({
      type,
      payload,
    } as Extract<TimerServerMessage, { type: TType }>);
}

export const TimerMessageBuilders = {
  stateChanged: createTimerMessageBuilder('timer:state-changed'),
};
