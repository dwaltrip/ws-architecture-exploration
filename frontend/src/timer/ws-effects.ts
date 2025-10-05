import type { ClientMessage } from '../../../common/src';
import { createWsRef } from '../ws/create-ws-ref';

type TimerStartMessage = Extract<ClientMessage, { type: 'timer:start' }>;
type TimerPauseMessage = Extract<ClientMessage, { type: 'timer:pause' }>;
type TimerResumeMessage = Extract<ClientMessage, { type: 'timer:resume' }>;
type TimerResetMessage = Extract<ClientMessage, { type: 'timer:reset' }>;

interface TimerWsEffects {
  startTimer(roomId: string, durationSeconds: number): void;
  pauseTimer(roomId: string): void;
  resumeTimer(roomId: string): void;
  resetTimer(roomId: string): void;
}

const ws = createWsRef('Timer');

const timerWsEffects: TimerWsEffects = {
  startTimer(roomId: string, durationSeconds: number) {
    const message: TimerStartMessage = {
      type: 'timer:start',
      payload: { roomId, durationSeconds },
    };
    ws.getClient().send(message);
  },

  pauseTimer(roomId: string) {
    const message: TimerPauseMessage = {
      type: 'timer:pause',
      payload: { roomId },
    };
    ws.getClient().send(message);
  },

  resumeTimer(roomId: string) {
    const message: TimerResumeMessage = {
      type: 'timer:resume',
      payload: { roomId },
    };
    ws.getClient().send(message);
  },

  resetTimer(roomId: string) {
    const message: TimerResetMessage = {
      type: 'timer:reset',
      payload: { roomId },
    };
    ws.getClient().send(message);
  },
};

export { timerWsEffects, ws as timerWs };
