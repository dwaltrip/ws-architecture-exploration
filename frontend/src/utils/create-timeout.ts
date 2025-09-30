
interface Timeout {
  start(): void;
  clear(): void;
}

function createTimeout(cb: () => void, delay: number): Timeout {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  function start() {
    if (timeoutId !== null) {
      return;
    }
    timeoutId = setTimeout(() => {
      cb();
      timeoutId = null;
    }, delay);
  }

  function clear() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  return { start, clear };
}

export type { Timeout };
export { createTimeout };
