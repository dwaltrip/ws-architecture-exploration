import { timerActions } from "./actions";

const createTimerTicker = function() {
  let intervalId: number | null = null;

  function tick() {
    timerActions.tickTimers();
  }

  return {
    start() {
      if (!intervalId) {
        intervalId = setInterval(tick, 1000);
      }
    },
    stop() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  }
}

function initTimerTick() {
  const ticker = createTimerTicker();
  ticker.start();
}

export { initTimerTick };
