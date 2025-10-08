import { useEffect } from 'react';

import { GRID_SIZE } from '../../../../common/src/game/constants';
import { useGameStore } from '../../game/game-store';
import { useGameActions } from '../../game/actions';
import { useUserStore } from '../../stores/user-store';
import { useArrowKeyMovement } from './use-arrow-key-movement';

export function GamePage() {
  const players = useGameStore((state) => state.players);
  const currentUserId = useUserStore((state) => state.userId);
  const gameActions = useGameActions();

  const currentPlayer = players.find((p) => p.userId === currentUserId);

  useEffect(() => {
    gameActions.joinGame();

    return () => {
      gameActions.leaveGame();
    };
  }, [gameActions]);


  useArrowKeyMovement(
    currentPlayer?.x ?? null,
    currentPlayer?.y ?? null,
    gameActions.movePlayer,
  );

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Game Grid</h1>
      <p>Use arrow keys to move your player (highlighted)</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 30px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 30px)`,
          gap: '1px',
          backgroundColor: '#ccc',
          padding: '1px',
          marginTop: '1rem',
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
          const x = index % GRID_SIZE;
          const y = Math.floor(index / GRID_SIZE);

          const playersAtPosition = players.filter((p) => p.x === x && p.y === y);

          return (
            <div
              key={index}
              style={{
                backgroundColor: '#fff',
                position: 'relative',
                width: '30px',
                height: '30px',
              }}
            >
              {playersAtPosition.map((player) => {
                const isCurrentPlayer = player.userId === currentUserId;
                return (
                  <div
                    key={player.userId}
                    title={player.username}
                    style={{
                      position: 'absolute',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: player.color,
                      top: '3px',
                      left: '3px',
                      border: isCurrentPlayer ? '2px solid black' : 'none',
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '1rem' }}>
        <p>Players online: {players.length}</p>
      </div>
    </div>
  );
}
