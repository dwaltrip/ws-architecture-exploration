import type { AppWsClient } from '../ws/types';
import type { ClientMessage } from '../../../common/src';

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

let _client: AppWsClient | null = null;

export function initTimerWsEffects(client: AppWsClient): void {
  _client = client;
}

export function resetTimerWsEffectsForTests(): void {
  _client = null;
}

export const timerWsEffects: TimerWsEffects = {
  startTimer(roomId: string, durationSeconds: number) {
    if (!_client) {
      throw new Error('Timer WS effects not initialized');
    }
    const message: TimerStartMessage = {
      type: 'timer:start',
      payload: { roomId, durationSeconds },
    };
    _client.send(message);
  },

  pauseTimer(roomId: string) {
    if (!_client) {
      throw new Error('Timer WS effects not initialized');
    }
    const message: TimerPauseMessage = {
      type: 'timer:pause',
      payload: { roomId },
    };
    _client.send(message);
  },

  resumeTimer(roomId: string) {
    if (!_client) {
      throw new Error('Timer WS effects not initialized');
    }
    const message: TimerResumeMessage = {
      type: 'timer:resume',
      payload: { roomId },
    };
    _client.send(message);
  },

  resetTimer(roomId: string) {
    if (!_client) {
      throw new Error('Timer WS effects not initialized');
    }
    const message: TimerResetMessage = {
      type: 'timer:reset',
      payload: { roomId },
    };
    _client.send(message);
  },
};

export type { TimerWsEffects };
