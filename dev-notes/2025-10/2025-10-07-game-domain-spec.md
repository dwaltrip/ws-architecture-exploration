# Game Domain Specification

**Date**: 2025-10-07

## Overview
Simple grid-based multiplayer game where users can move around on a 20x20 grid. Backend tracks all player positions and broadcasts state at fixed intervals.

## Design Goals
- **KEEP IT SIMPLE** - All game logic in one specialized file
- Test the WebSocket architecture with a new domain
- Minimal rendering, minimal validation
- Follow existing `chat` and `timer` domain patterns

## Game Mechanics

### Grid
- **Size**: 20x20 grid
- **Coordinates**: (0,0) to (19,19)
- **No rooms**: Single shared game world (room-agnostic)

### Players
- **Spawn**: Automatic random position on connection
- **Movement**: Absolute coordinates `{x, y}`
- **Validation**: Only check that moves stay within grid bounds (0-19)
- **Collisions**: None - players can occupy the same space
- **Disconnection**: Remove player from grid immediately

### State Updates
- **Backend**: Broadcasts full game state every 50ms via interval
- **Frontend**: Sends move requests immediately on user action
- **State format**: Array of all player positions with userId/username

## Architecture

### Backend Structure

```
backend/src/
├── domains/game/
│   ├── index.ts           # Exports
│   ├── handlers.ts        # WebSocket message handlers
│   ├── actions.ts         # Core game logic (spawn, move, disconnect)
│   ├── message-builders.ts # Server message constructors
│   ├── store-singleton.ts  # Game store instance
│   └── init.ts            # 50ms broadcast interval
├── db/
│   └── game-store.ts      # In-memory player position storage
```

### Data Types

**Store (backend/db/game-store.ts):**
```typescript
type PlayerPosition = {
  userId: string;
  username: string;
  x: number;
  y: number;
}

// Store: Map<userId, PlayerPosition>
```

**Client Messages (common/src/game/client-messages.ts):**
```typescript
'game:move': { x: number; y: number }
```

**Server Messages (common/src/game/server-messages.ts):**
```typescript
'game:state': {
  players: Array<{ userId: string; username: string; x: number; y: number }>
}
```

### Game Logic (backend/src/domains/game/actions.ts)

**Core functions:**
- `spawnPlayer(userId, username)` - Add player at random position
- `movePlayer(userId, x, y)` - Update player position (validate bounds)
- `removePlayer(userId)` - Remove player from grid
- `getGameState()` - Return all player positions
- `broadcastGameState()` - Send state to all connected clients (called by interval)

**Validation:**
- Move must be within bounds: `0 <= x <= 19` and `0 <= y <= 19`
- If invalid, ignore move (don't crash, don't broadcast error)

### Background Process (backend/src/domains/game/init.ts)

Similar to timer's tick:
- 50ms interval
- Broadcasts full game state to all clients
- Runs continuously after server starts

### Frontend

**Visual Rendering:**
- 20x20 grid of divs
- Players rendered as colored circles
- Dead simple CSS, no fancy animations
- Each player gets a consistent color (hash userId to color or random)

**Interaction:**

- Arrow keys for relative movement
- Immediately send `game:move` message to backend

## Implementation Checklist

### Backend
- [ ] Create `db/game-store.ts` with player position storage
- [ ] Create `domains/game/store-singleton.ts`
- [ ] Create `domains/game/actions.ts` with spawn/move/remove logic
- [ ] Create `domains/game/handlers.ts` for `game:move`
- [ ] Create `domains/game/message-builders.ts` for `game:state`
- [ ] Create `domains/game/init.ts` with 50ms broadcast interval
- [ ] Create `domains/game/index.ts` exports
- [ ] Hook into connection/disconnection events for spawn/remove
- [ ] Register handlers in `server.ts`
- [ ] Call `initGameTick()` in `server.ts`

### Common (Shared Types)
- [ ] Create `common/src/game/client-messages.ts`
- [ ] Create `common/src/game/server-messages.ts`
- [ ] Create `common/src/game/index.ts` exports
- [ ] Update `common/src/messages.ts` to include game messages

### Frontend
- [ ] Create game grid component (20x20 divs)
- [ ] Handle `game:state` messages to render players
- [ ] Send `game:move` on grid cell click
- [ ] Style players as colored circles

## Notes
- No sophisticated collision detection or turn-based mechanics
- No persistence - state resets when server restarts
- Following the pattern: handlers → actions → store → wsBridge.broadcast
