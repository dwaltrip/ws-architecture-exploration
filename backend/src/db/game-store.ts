export interface GamePlayer {
  userId: string;
  username: string;
  x: number;
  y: number;
  color: string;
}

type GameStore = {
  get(userId: string): GamePlayer | null;
  getAll(): GamePlayer[];
  set(userId: string, player: GamePlayer): void;
  remove(userId: string): void;
  has(userId: string): boolean;
  count(): number;
  reset(): void;
};

export function createGameStore(): GameStore {
  const players = new Map<string, GamePlayer>();

  return {
    get(userId) {
      return players.get(userId) ?? null;
    },
    getAll() {
      return Array.from(players.values());
    },
    set(userId, player) {
      players.set(userId, player);
    },
    remove(userId) {
      players.delete(userId);
    },
    has(userId) {
      return players.has(userId);
    },
    count() {
      return players.size;
    },
    reset() {
      players.clear();
    },
  };
}
