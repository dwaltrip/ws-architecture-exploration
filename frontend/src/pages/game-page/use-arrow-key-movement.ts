import { useEffect } from "react";
import { GRID_SIZE } from '../../../../common/src/game/constants';

function useArrowKeyMovement(
  x: number | null,
  y: number | null,
  handleMove: (x: number, y: number) => void
) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (x === null || y === null) {
        return;
      }

      let newX = x;
      let newY = y;

      switch (event.key) {
        case 'ArrowUp':
          newY = Math.max(0, y - 1);
          break;
        case 'ArrowDown':
          newY = Math.min(GRID_SIZE - 1, y + 1);
          break;
        case 'ArrowLeft':
          newX = Math.max(0, x - 1);
          break;
        case 'ArrowRight':
          newX = Math.min(GRID_SIZE - 1, x + 1);
          break;
        default:
          return;
      }

      handleMove(newX, newY);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [x, y]);
}

export { useArrowKeyMovement}
