# User Identity System Specification

**Date**: 2025-10-07

## Background

Currently, the application lacks a consistent user identity system. The chat domain calls `generateUser()` on every message, creating ephemeral user objects that don't persist across messages or domains. This is brittle and prevents features like multiplayer games from identifying users consistently. This spec introduces a minimal user identity system: users are created once per WebSocket connection, stored in backend and frontend stores, and referenced consistently across all domains via `userId`.

## Design Goals

- **One user per connection** - Generate user identity once on connect, not per message
- **Single source of truth** - Backend user-store holds canonical user data
- **Minimal ctx** - Handlers receive only `userId`, look up details as needed
- **Cross-domain consistency** - All domains (chat, game, timer) use the same user identity
- **Simple implementation** - Hardcoded username generation, counter-based IDs, no external dependencies

## Architecture Overview

### Backend Structure

```
backend/src/
├── db/
│   └── user-store.ts          # User storage with counter-based ID generation
├── domains/system/
│   ├── actions.ts             # createUser(), removeUser()
│   └── message-builders.ts    # buildUserInfoMessage()
└── utils/
    └── username-generator.ts  # generateUsername() with hardcoded lists
```

### Data Flow

**Connection:**
```
WebSocket connects
  ↓
system/actions.createUser() → generates userId + username
  ↓
Store in user-store (backend)
  ↓
Store userId in clients map
  ↓
Send system:user-info to client
  ↓
Client stores in user-store (frontend Zustand)
```

**Message Handling:**
```
Message received on WebSocket
  ↓
server.ts looks up userId from clients map
  ↓
Passes ctx = { userId } to domain handler
  ↓
Handler looks up user details from user-store if needed
```

**Disconnection:**
```
WebSocket disconnects
  ↓
system/actions.removeUser(userId)
  ↓
Remove from user-store
  ↓
Remove from clients map
  ↓
Domain cleanup (e.g., game removePlayer)
```

## Implementation Details

### 1. User Store (Backend)

**File:** `backend/src/db/user-store.ts`

Counter-based ID generation with in-memory storage:

```typescript
type User = {
  userId: string;
  username: string;
};

let userIdCounter = 0;
const users = new Map<string, User>();

export function generateUserId(): string {
  return `user_${++userIdCounter}`;
}

export function addUser(userId: string, username: string): void {
  users.set(userId, { userId, username });
}

export function getUser(userId: string): User | undefined {
  return users.get(userId);
}

export function removeUser(userId: string): void {
  users.delete(userId);
}

export function getAllUsers(): User[] {
  return Array.from(users.values());
}
```

**Reasoning:** Simple counter ensures unique IDs without external dependencies. Store owns counter state to keep ID generation atomic with storage.

### 2. Username Generator

**File:** `backend/src/utils/username-generator.ts`

Hardcoded adjectives and animals for readable usernames:

```typescript
const ADJECTIVES = [
  'Swift', 'Clever', 'Brave', 'Silent', 'Mighty',
  'Wise', 'Bold', 'Quick', 'Calm', 'Fierce'
];

const ANIMALS = [
  'Panda', 'Tiger', 'Eagle', 'Wolf', 'Fox',
  'Bear', 'Hawk', 'Lion', 'Owl', 'Shark'
];

export function generateUsername(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adjective} ${animal}`;
}
```

**Reasoning:** 100 possible combinations (10×10) sufficient for demo. Backend-only utility since only server generates usernames.

### 3. System Domain Actions

**File:** `backend/src/domains/system/actions.ts`

Business logic for user lifecycle:

```typescript
import * as userStore from '../../db/user-store.js';
import { generateUsername } from '../../utils/username-generator.js';

export function createUser(): { userId: string; username: string } {
  const userId = userStore.generateUserId();
  const username = generateUsername();
  userStore.addUser(userId, username);
  return { userId, username };
}

export function removeUser(userId: string): void {
  userStore.removeUser(userId);
}
```

**Reasoning:** Follows existing pattern of placing business logic in domain actions. Keeps connection handling (server.ts) separate from user management logic.

### 4. System Messages (Common)

**File:** `common/src/system/server-messages.ts`

Add new message type for user info:

```typescript
export type SystemServerMessages = {
  'system:user-info': {
    userId: string;
    username: string;
  };
  // ... existing system messages
};
```

**Reasoning:** Client needs to know its own userId and username to identify itself in game state and display in UI.

### 5. Handler Context Updates

**Current pattern:**
```typescript
handler(ws: WebSocket, payload: SomePayload, ctx: { username: string })
```

**New pattern:**
```typescript
handler(ws: WebSocket, payload: SomePayload, ctx: { userId: string })
```

**Example usage in chat handler:**
```typescript
import * as userStore from '../../db/user-store.js';

export function handleChatMessage(
  ws: WebSocket,
  payload: { message: string },
  ctx: { userId: string }
) {
  const user = userStore.getUser(ctx.userId);
  if (!user) return; // Shouldn't happen, but guard

  // Build and broadcast chat message with user.username
  const chatMsg = buildChatMessage(user.userId, user.username, payload.message);
  wsBridge.broadcast('chat:message', chatMsg);
}
```

**Reasoning:** `ctx` stays minimal (just userId). Handlers fetch full user details only when needed. User-store is single source of truth.

### 6. Server Integration

**File:** `backend/src/server.ts`

Connection handler:

```typescript
import * as systemActions from './domains/system/actions.js';
import { buildUserInfoMessage } from './domains/system/message-builders.js';

wss.on('connection', (ws) => {
  const connectionId = generateConnectionId();

  // Create user
  const user = systemActions.createUser();

  // Store connection mapping
  clients.set(connectionId, { userId: user.userId, ws });

  // Send user info to client
  ws.send(JSON.stringify(buildUserInfoMessage(user.userId, user.username)));

  // ... existing handler registration
});
```

Message handler lookup:

```typescript
ws.on('message', (data) => {
  const { type, payload } = JSON.parse(data.toString());

  // Look up userId from connection
  const client = clients.get(connectionId);
  if (!client) return;

  const ctx = { userId: client.userId };

  // Dispatch to handler with ctx
  const handler = handlers.get(type);
  if (handler) {
    handler(ws, payload, ctx);
  }
});
```

Disconnection handler:

```typescript
ws.on('close', () => {
  const client = clients.get(connectionId);
  if (client) {
    systemActions.removeUser(client.userId);
    clients.delete(connectionId);
    // ... domain cleanup (game, etc.)
  }
});
```

**Reasoning:** Server orchestrates lifecycle but delegates business logic to system actions. Connection-to-user mapping lives in existing `clients` map.

### 7. Frontend User Store

**File:** `frontend/src/stores/user-store.ts`

Zustand store for current user:

```typescript
import { create } from 'zustand';

type UserState = {
  userId: string | null;
  username: string | null;
  setUser: (userId: string, username: string) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  userId: null,
  username: null,
  setUser: (userId, username) => set({ userId, username }),
  clearUser: () => set({ userId: null, username: null }),
}));
```

**Reasoning:** Minimal state for "who am I". Game and chat components can read `userId` to identify current user in broadcasts.

### 8. Frontend Message Handler

**File:** `frontend/src/utils/websocket.ts` (or message handler)

Handle `system:user-info` message:

```typescript
import { useUserStore } from '../stores/user-store';

// In message handler
case 'system:user-info': {
  const { userId, username } = payload;
  useUserStore.getState().setUser(userId, username);
  break;
}
```

**Reasoning:** Update local user store when server sends identity. Called once per connection.

## Migration Impact

### Chat Domain Changes

**Before:**
```typescript
// chat/message-builders.ts
function generateUser() {
  return {
    userId: Math.random().toString(),
    username: 'User'
  };
}

export function buildChatMessage(message: string) {
  const user = generateUser(); // Called per message!
  return { ...user, message };
}
```

**After:**
```typescript
// chat/handlers.ts
export function handleChatMessage(ws, payload, ctx: { userId: string }) {
  const user = userStore.getUser(ctx.userId);
  const chatMsg = buildChatMessage(user.userId, user.username, payload.message);
  wsBridge.broadcast('chat:message', chatMsg);
}
```

**Impact:** Remove `generateUser()` from chat domain entirely. Use user-store lookup instead.

### Game Domain Integration

Game domain (to be implemented) will use user identity:

```typescript
// game/handlers.ts
export function handleGameMove(ws, payload, ctx: { userId: string }) {
  const user = userStore.getUser(ctx.userId);
  gameActions.movePlayer(user.userId, payload.x, payload.y);
}

// Frontend game component
const currentUserId = useUserStore((state) => state.userId);
const isMe = player.userId === currentUserId; // Highlight own player
```

**Benefit:** Game can identify "current player" without additional messages or flags.

## Implementation Checklist

### Backend
- [ ] Create `utils/username-generator.ts` with hardcoded lists
- [ ] Create `db/user-store.ts` with counter-based IDs
- [ ] Add `createUser()` and `removeUser()` to `domains/system/actions.ts`
- [ ] Add `buildUserInfoMessage()` to `domains/system/message-builders.ts`
- [ ] Update `server.ts` connection handler to call `createUser()` and send `system:user-info`
- [ ] Update `server.ts` message handler to pass `ctx = { userId }`
- [ ] Update `server.ts` disconnect handler to call `removeUser()`
- [ ] Update chat handlers to use `ctx.userId` and user-store lookup
- [ ] Remove `generateUser()` from chat domain

### Common
- [ ] Add `system:user-info` message type to `common/src/system/server-messages.ts`
- [ ] Update `common/src/messages.ts` to include new message type

### Frontend
- [ ] Create `stores/user-store.ts` with Zustand
- [ ] Add `system:user-info` handler to update user store
- [ ] Update chat UI to show username from user store (if needed)

## Notes

- Users are per-connection, not persistent across reconnects
- No authentication or authorization - purely identity for demo purposes
- Username collisions possible (100 combinations) - acceptable for demo
- Counter resets on server restart - acceptable for demo
- Future: Could add timestamp or connection count to username for uniqueness
