import { TimerStateChangedPayload } from "../../../../common/src";
import { wsBridge } from "../../ws/bridge";

const timerWsEffects = {
  broadcastStateChange(roomId: string, newState: TimerStateChangedPayload) {
    wsBridge.broadcastToRoom(
      roomId,
      { type: 'timer:state-changed', payload: newState }
    );
  },
};

export { timerWsEffects };
