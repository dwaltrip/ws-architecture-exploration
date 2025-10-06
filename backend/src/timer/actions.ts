import type {
  TimerStartPayload,
  TimerPausePayload,
  TimerResetPayload,
  TimerResumePayload,
  TimerStateChangedPayload,
} from '../../../common/src';
import type { HandlerContext } from '../ws/types';
import { TimerService } from './service';

export class TimerActions {
  constructor(private readonly timerService: TimerService) {}

  startTimer(
    payload: TimerStartPayload,
    ctx: HandlerContext
  ): TimerStateChangedPayload {
    console.log('[TimerActions] startTimer', {
      payload,
      userId: ctx.userId,
    });

    const state = this.timerService.startTimer(
      payload.roomId,
      payload.durationSeconds
    );

    return {
      roomId: payload.roomId,
      status: state.status,
      remainingSeconds: state.remainingSeconds,
      totalDurationSeconds: state.totalDurationSeconds,
      startedAt: state.startedAt,
    };
  }

  pauseTimer(
    payload: TimerPausePayload,
    ctx: HandlerContext
  ): TimerStateChangedPayload {
    console.log('[TimerActions] pauseTimer', {
      payload,
      userId: ctx.userId,
    });

    const state = this.timerService.pauseTimer(payload.roomId);

    return {
      roomId: payload.roomId,
      status: state.status,
      remainingSeconds: state.remainingSeconds,
      totalDurationSeconds: state.totalDurationSeconds,
      startedAt: state.startedAt,
    };
  }

  resumeTimer(
    payload: TimerResumePayload,
    ctx: HandlerContext
  ): TimerStateChangedPayload {
    console.log('[TimerActions] resumeTimer', {
      payload,
      userId: ctx.userId,
    });

    const state = this.timerService.resumeTimer(payload.roomId);

    return {
      roomId: payload.roomId,
      status: state.status,
      remainingSeconds: state.remainingSeconds,
      totalDurationSeconds: state.totalDurationSeconds,
      startedAt: state.startedAt,
    };
  }

  resetTimer(
    payload: TimerResetPayload,
    ctx: HandlerContext
  ): TimerStateChangedPayload {
    console.log('[TimerActions] resetTimer', {
      payload,
      userId: ctx.userId,
    });

    const state = this.timerService.resetTimer(payload.roomId);

    return {
      roomId: payload.roomId,
      status: state.status,
      remainingSeconds: state.remainingSeconds,
      totalDurationSeconds: state.totalDurationSeconds,
      startedAt: state.startedAt,
    };
  }
}
