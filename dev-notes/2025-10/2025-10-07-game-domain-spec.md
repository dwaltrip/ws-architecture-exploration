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
- **Spawn**: Random position with collision avoidance (try 50 times, throw if grid too crowded)
- **Movement**: Absolute coordinates `{x, y}`
- **Validation**: Only check that moves stay within grid bounds (0-19)
- **Collisions**: None - players can occupy the same space
- **Color**: Deterministic based on userId (same user always gets same color)
- **Join/Leave**: Players spawn on `game:join` message, removed on `game:leave` or disconnect
- **Respawn**: New random position each time user rejoins game page

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
│   ├── handlers.ts        # WebSocket message handlers (join, move, leave)
│   ├── actions.ts         # Core game logic (spawn, move, remove, broadcast)
│   ├── message-builders.ts # Server message constructors
│   ├── store-singleton.ts  # Game store instance
│   └── init.ts            # 50ms broadcast interval
├── db/
│   └── game-store.ts      # In-memory player storage (position + color)
├── utils/
│   └── user-color.ts      # getUserColor(userId) - deterministic color
```

### Lifecycle Flow

**User Joins Game:**
```
User navigates to game page
  ↓
Game component mounts
  ↓
Send game:join message
  ↓
Backend: joinGame(userId, username)
  ↓
Generate random position (50 tries, collision avoidance)
  ↓
Generate color: getUserColor(userId)
  ↓
Store player in game-store
  ↓
Next 50ms tick broadcasts updated game:state to all clients
```

**User Leaves Game:**
```
User navigates away from game page
  ↓
Game component unmounts
  ↓
Send game:leave message
  ↓
Backend: leaveGame(userId)
  ↓
Remove player from game-store
  ↓
Next 50ms tick broadcasts updated game:state
```

**User Disconnects:**
```
WebSocket disconnects
  ↓
server.ts onDisconnect handler
  ↓
If player in game: leaveGame(userId)
  ↓
Remove player from game-store
```

### Data Types

**Store (backend/db/game-store.ts):**
```typescript
type GamePlayer = {
  userId: string;
  username: string;
  x: number;
  y: number;
  color: string; // HSL color string, generated once on join
}

// Store: Map<userId, GamePlayer>
```

**Client Messages (common/src/game/client-messages.ts):**
```typescript
'game:join': {}  // Sent when Game component mounts
'game:move': { x: number; y: number }
'game:leave': {}  // Sent when Game component unmounts
```

**Server Messages (common/src/game/server-messages.ts):**
```typescript
'game:state': {
  players: Array<{ userId: string; username: string; x: number; y: number; color: string }>
}
```

### Game Logic (backend/src/domains/game/actions.ts)

**Core functions:**
- `joinGame(userId, username)` - Spawn player at random position with deterministic color
- `movePlayer(userId, x, y)` - Update player position (validate bounds)
- `leaveGame(userId)` - Remove player from grid
- `getGameState()` - Return all player positions
- `broadcastGameState()` - Send state to all connected clients (called by interval)

**Spawn Logic:**
- Try up to 50 random positions to avoid existing players
- If all 50 attempts fail (grid >90% full), throw error
- Generate color using `getUserColor(userId)` utility

**Validation:**
- Move must be within bounds: `0 <= x <= 19` and `0 <= y <= 19`
- If invalid, ignore move (don't crash, don't broadcast error)

**Color Utility (backend/src/utils/user-color.ts):**
```typescript
export function getUserColor(userId: string): string {
  // Hash userId to hue (0-360)
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`; // Consistent saturation/lightness
}
```

### Background Process (backend/src/domains/game/init.ts)

Similar to timer's tick:
- 50ms interval
- Broadcasts full game state to all clients
- Runs continuously after server starts

### Frontend

**Navigation:**
- Simple tab state in `App.tsx`: `'chat' | 'game'`
- Nav bar at top with buttons to switch views
- Conditionally render `<ChatPage />` or `<GamePage />` based on active tab
- No routing library needed

**Game Component Lifecycle:**
- On mount: Send `game:join` message to backend
- On unmount: Send `game:leave` message to backend
- Backend responds by spawning/removing player from game state

**Visual Rendering:**
- 20x20 grid of divs
- Players rendered as colored circles using `color` from game state
- Dead simple CSS, no fancy animations
- Highlight current player (compare userId with user-store)

**Interaction:**
- Arrow keys for relative movement (up/down/left/right)
- Frontend calculates new absolute position from current position in game state
- Validate bounds client-side (0-19)
- Send `game:move` with absolute `{x, y}` to backend

## Implementation Checklist

### Backend
- [ ] Create `utils/user-color.ts` with `getUserColor(userId)` function
- [ ] Create `db/game-store.ts` with player storage (includes color)
- [ ] Create `domains/game/store-singleton.ts`
- [ ] Create `domains/game/actions.ts` with `joinGame()`, `movePlayer()`, `leaveGame()`, `broadcastGameState()`
- [ ] Create `domains/game/handlers.ts` for `game:join`, `game:move`, `game:leave`
- [ ] Create `domains/game/message-builders.ts` for `game:state`
- [ ] Create `domains/game/init.ts` with 50ms broadcast interval
- [ ] Create `domains/game/index.ts` exports
- [ ] Register handlers in `server.ts`
- [ ] Call `initGameTick()` in `server.ts`
- [ ] Handle disconnect cleanup (remove player if disconnected while in game)

### Common (Shared Types)
- [ ] Create `common/src/game/client-messages.ts` (`game:join`, `game:move`, `game:leave`)
- [ ] Create `common/src/game/server-messages.ts` (`game:state`)
- [ ] Create `common/src/game/index.ts` exports
- [ ] Update `common/src/messages.ts` to include game messages

### Frontend
- [ ] Add navigation: tab state in `App.tsx` with nav bar
- [ ] Create `pages/game-page/` directory structure
- [ ] Create game grid component (20x20 divs)
- [ ] Send `game:join` on component mount
- [ ] Send `game:leave` on component unmount
- [ ] Handle `game:state` messages to render players with colors
- [ ] Arrow key listener to calculate new position and send `game:move`
- [ ] Highlight current player (match userId from user-store)
- [ ] Style players as colored circles using `color` from state

## Notes
- No sophisticated collision detection or turn-based mechanics
- No persistence - state resets when server restarts, players respawn each time they rejoin
- Following the pattern: handlers → actions → store → wsBridge.broadcast
- Game lifecycle tied to page navigation, not WebSocket connection (allows users to be connected but not in game)
- Color generation is deterministic (same userId = same color) but collisions possible with hash function
- Backend doesn't know which page frontend is on - frontend explicitly signals game participation via join/leave messages
