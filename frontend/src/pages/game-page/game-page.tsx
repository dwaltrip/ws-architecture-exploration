import { useEffect } from 'react';

import { GRID_SIZE } from '../../../../common/src/game/constants';
import type { GamePlayer } from '../../../../common/src';

import { useGameStore } from '../../game/game-store';
import { useGameActions } from '../../game/actions';
import { useUserStore } from '../../stores/user-store';
import { useArrowKeyMovement } from './use-arrow-key-movement';

import './game-page.css';

interface GameTileProps {
  // x: number;
  // y: number;
  playersOnTile: GamePlayer[];
  currentUserId: string | null;
}

function GameTile({ playersOnTile, currentUserId }: GameTileProps) {
  return (
    <div className="game-tile">
      {playersOnTile.map((player) => {
        const isCurrentPlayer = player.userId === currentUserId;
        return (
          <div
            key={player.userId}
            title={player.username}
            className={`player-marker ${isCurrentPlayer ? 'current-player' : ''}`}
            style={{ '--player-color': player.color } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

interface GameBoardProps {
  currentUserId: string | null;
  getPlayerForPos: (x: number, y: number) => GamePlayer[];
  size: number;
}

function GameBoard({
  currentUserId,
  getPlayerForPos,
  size
}: GameBoardProps) {
  return (
    <div
      className="game-board"
      style={{ '--grid-size': size } as React.CSSProperties}
    >
      {Array.from({ length: size * size }).map((_, index) => {
        const x = index % size;
        const y = Math.floor(index / size);
        const players = getPlayerForPos(x, y);
        return (
          <GameTile
            playersOnTile={players}
            currentUserId={currentUserId}
            key={index}
          />
        );
      })}
    </div>
  );
}

function posStr(x: number, y: number) {
  return `${x},${y}`;
}

function buildPlayersByPos(players: GamePlayer[]) {
  return players.reduce((memo, player) => {
    const { x, y } = player;
    const pos = posStr(x, y);
    if (!memo[pos]) {
      memo[pos] = [];
    }
    memo[pos].push(player);
    return memo;
  }, {} as Record<string, GamePlayer[]>);
}


function GamePage() {
  const players = useGameStore((state) => state.players);
  const currentUserId = useUserStore((state) => state.userId);
  const gameActions = useGameActions();

  const currentPlayer = players.find((p) => p.userId === currentUserId);
  const playersByPos = buildPlayersByPos(players);

  useEffect(() => {
    gameActions.joinGame();
    return () => gameActions.leaveGame();
  }, [gameActions]);

  useArrowKeyMovement(
    currentPlayer?.x ?? null,
    currentPlayer?.y ?? null,
    gameActions.movePlayer,
  );

  return (
    <div className="game-page">
      <div>
        <b>Game Grid</b> -- Use arrow keys to move
        <span className="game-stats">Players online: {players.length}</span>
      </div>
      <GameBoard
        getPlayerForPos={(x, y) => playersByPos[posStr(x, y)] || []}
        currentUserId={currentUserId}
        size={GRID_SIZE}
      />
    </div>
  );
}

export { GamePage };
