import { useState } from "react";
import { useTimerStore, selectTimerForRoom } from "./timer-store";
import { useTimerActions } from "./actions";

interface TimerControlsProps {
  roomId: string | null;
}

export function TimerControls({ roomId }: TimerControlsProps) {
  const [timerMinutes, setTimerMinutes] = useState('5');
  const { startTimer, pauseTimer, resumeTimer, resetTimer } = useTimerActions();
  const timerState = useTimerStore(selectTimerForRoom(roomId || ''));

  const handleStartTimer = () => {
    if (!roomId) return;
    const durationSeconds = parseInt(timerMinutes, 10) * 60;
    startTimer(roomId, durationSeconds);
  };

  const handlePauseTimer = () => {
    if (!roomId) return;
    pauseTimer(roomId);
  };

  const handleResumeTimer = () => {
    if (!roomId) return;
    resumeTimer(roomId);
  };

  const handleResetTimer = () => {
    if (!roomId) return;
    resetTimer(roomId);
  };

  // Calculate display time
  const getDisplayTime = () => {
    if (timerState.status === 'running' && timerState.startedAt) {
      const elapsed = (Date.now() - timerState.startedAt) / 1000;
      const remaining = Math.max(0, timerState.remainingSeconds - elapsed);
      return Math.floor(remaining);
    }
    return Math.floor(timerState.remainingSeconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
        {formatTime(getDisplayTime())}
      </div>
      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
        Status: {timerState.status}
      </div>

      {timerState.status === 'idle' && (
        <div style={{ marginBottom: '8px' }}>
          <input
            type="number"
            value={timerMinutes}
            onChange={(e) => setTimerMinutes(e.target.value)}
            min="1"
            style={{ width: '60px', marginRight: '4px' }}
          />
          <span>minutes</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {timerState.status === 'idle' && (
          <button onClick={handleStartTimer} disabled={!roomId}>
            Start
          </button>
        )}
        {timerState.status === 'running' && (
          <button onClick={handlePauseTimer}>Pause</button>
        )}
        {timerState.status === 'paused' && (
          <button onClick={handleResumeTimer}>Resume</button>
        )}
        {timerState.status !== 'idle' && (
          <button onClick={handleResetTimer}>Reset</button>
        )}
      </div>
    </div>
  );
}
