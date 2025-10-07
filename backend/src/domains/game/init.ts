import { gameActions } from './actions';

const createGameTicker = function() {
  let intervalId: number | null = null;

  function tick() {
    gameActions.broadcastGameState();
  }

  return {
    start() {
      if (!intervalId) {
        intervalId = setInterval(tick, 50);
      }
    },
    stop() {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  };
};

function initGameTick() {
  const ticker = createGameTicker();
  ticker.start();
}

export { initGameTick };
