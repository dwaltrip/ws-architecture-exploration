# WebSocket Handler Registration Bootstrap Plan v2

**Date:** 2025-10-03
**Status:** Draft for Review
**Replaces:** v1 plan (same date)

## Key Changes from v1

- **Uses builder pattern** instead of runtime validator (compile-time completeness check via `satisfies`)
- **Breaks circular dependency** with minimal DI in ws-effects only (no other modules need changes)
- **Replaces runtime validator with compile-time coverage plus a small dev-only assertion** so we still fail loudly if TypeScript gets bypassed
- **Fixes critical bugs** discovered in review (ServerMessageType union, useWsClient hook)
- **Simplifies** by removing unnecessary abstractions (ChatProvider, createDomainHandlerMap helper)

## Background

Same as v1: Earlier exploration of consolidated handler registration revealed type friction, centralization concerns, and lifecycle confusion with React Strict Mode. This v2 plan addresses those issues plus critical bugs found during technical review.

## Context

- Each domain (chat, system) currently registers handlers independently via `registerHandlers()` calls
- Handlers reference actions → ws-effects → `getWsClient()`, creating a circular dependency if we try to pass handlers at construction time
- `ChatProvider` triggers both handler registration and connection; Strict Mode double-invocation causes duplicate connects
- **Critical bug**: `ServerMessageType` union is incomplete (missing `SystemServerMessageType`)
- **Hook conflict**: `useWsClient` calls connect/disconnect, conflicting with centralized lifecycle
- We want **compile-time handler completeness** while keeping domains modular

## Decisions

- **Builder pattern with compile-time safety.** Bootstrap merges all domain handler maps and passes them to WSClient constructor. TypeScript's `satisfies` operator enforces completeness at compile time.
- **Break circular dependency via minimal DI.** Only ws-effects modules need DI (accept client as parameter). Handlers, actions, and stores remain unchanged.
- **App-level bootstrap owns lifecycle.** New `initializeWsApp()` in `frontend/src/ws/bootstrap.ts` creates the client with all handlers, wires up ws-effects, and connects once.
- **No runtime validator needed.** Compile-time `satisfies` check fails the build if any expected handler is missing.
- **Compile-time array sync.** Type-level assertion ensures message type arrays stay in sync with payload maps.
- **Remove conflicting abstractions.** Delete `ChatProvider` and `useWsClient` hook (no longer needed).

## Proposed Architecture

```
frontend/src/
├── ws/
│   ├── bootstrap.ts          ← exports initializeWsApp()
│   ├── client.ts             ← WSClient (no signature changes needed)
│   └── create-client.ts      ← removed (client created in bootstrap)
├── chat/
│   ├── handlers.ts           ← exports const chatHandlers
│   ├── ws-effects.ts         ← exports initChatWsEffects(client)
│   └── init.ts               ← DELETE (no longer needed)
├── system/
│   ├── handlers.ts           ← exports const systemHandlers
│   └── ws-effects.ts         ← exports initSystemWsEffects(client)
└── App.tsx                   ← useEffect(() => initializeWsApp(), [])
```

## Detailed Implementation Steps

### 1. Fix critical bug: ServerMessageType union

**File:** `common/src/messages.ts:34`

**Change:**
```typescript
// Before (BROKEN - missing system messages!)
export type ServerMessageType = ChatServerMessageType;

// After
export type ServerMessageType = ChatServerMessageType | SystemServerMessageType;
```

**Why:** The type union was incomplete, causing system messages to not be recognized by the type system.

---

### 2. Add compile-time array validation

**Files:** `common/src/chat/server-messages.ts` and `common/src/system/server-messages.ts`

**Add to each file:**
```typescript
// Type-level assertion utility
type AssertEqual<T, U> =
  (<G>() => G extends T ? 1 : 2) extends
  (<G>() => G extends U ? 1 : 2) ? true : never;

// After the exports, add compile-time check
const _checkChatMessageTypesComplete: AssertEqual<
  keyof ChatServerPayloadMap,
  typeof chatServerMessageTypes[number]
> = true;
```

**Why:** This fails compilation if someone adds a message type to the payload map but forgets to update the array, or vice versa. Zero runtime cost.

---

### 3. Refactor ws-effects with dependency injection

**File:** `frontend/src/chat/ws-effects.ts`

**Before:**
```typescript
import { getWsClient } from '../ws/create-client';
// ... exports chatWsEffects that calls getWsClient()
```

**After:**
```typescript
import type { AppWsClient } from '../ws/types';
import { createSendMessage } from './messages';

interface ChatWsEffects {
  postNewMessage(roomId: string, text: string): void;
}

let _client: AppWsClient | null = null;

export function initChatWsEffects(client: AppWsClient): void {
  _client = client;
}

export function resetChatWsEffectsForTests(): void {
  _client = null;
}

export const chatWsEffects: ChatWsEffects = {
  postNewMessage(roomId: string, text: string) {
    if (!_client) {
      throw new Error('Chat WS effects not initialized');
    }
    if (!text.trim()) {
      return;
    }
    _client.send(createSendMessage(text, roomId));
  },
};
```

**File:** `frontend/src/system/ws-effects.ts`

**Apply same pattern:**
```typescript
import type { AppWsClient } from '../ws/types';
import type { ClientMessage } from '../../../common/src';

type SystemRoomJoinMessage = Extract<ClientMessage, { type: 'system:room-join' }>;
type SystemRoomLeaveMessage = Extract<ClientMessage, { type: 'system:room-leave' }>;

interface SystemWsEffects {
  joinRoom(roomId: string): void;
  leaveRoom(roomId: string): void;
}

let _client: AppWsClient | null = null;

export function initSystemWsEffects(client: AppWsClient): void {
  _client = client;
}

export function resetSystemWsEffectsForTests(): void {
  _client = null;
}

function normalizeRoomId(roomId: string) {
  const trimmed = roomId.trim();
  if (!trimmed) {
    throw new Error('Room id must be a non-empty string');
  }
  return trimmed;
}

export const systemWsEffects: SystemWsEffects = {
  joinRoom(roomId: string) {
    if (!_client) {
      throw new Error('System WS effects not initialized');
    }
    const message: SystemRoomJoinMessage = {
      type: 'system:room-join',
      payload: { roomId: normalizeRoomId(roomId) },
    };
    _client.send(message);
  },

  leaveRoom(roomId: string) {
    if (!_client) {
      throw new Error('System WS effects not initialized');
    }
    const message: SystemRoomLeaveMessage = {
      type: 'system:room-leave',
      payload: { roomId: normalizeRoomId(roomId) },
    };
    _client.send(message);
  },
};
```

**Why:** Breaking the circular dependency allows us to import handlers at bootstrap time and pass them to WSClient constructor. The reset helpers line up with `resetWsInitializationForTests()` so test suites can restore both the client and its DI wiring between runs.

---

### 4. Refactor domain handlers to export const maps

**File:** `frontend/src/chat/handlers.ts`

**Before:**
```typescript
const chatHandlers: ChatHandlerMap = { /* ... */ };

let handlersRegistered = false;

function registerChatHandlers(): void {
  if (handlersRegistered) {
    return;
  }
  getWsClient().registerHandlers(chatHandlers);
  handlersRegistered = true;
}

export { chatHandlers, registerChatHandlers };
```

**After:**
```typescript
import type { ChatServerMessage, HandlerMap } from '../../../common/src';
import { chatActions } from './actions';

type ChatHandlerMap = HandlerMap<ChatServerMessage>;

export const chatHandlers = {
  'chat:message': (payload) => {
    const { id, text, userId } = payload;
    const { addReceivedMessage } = chatActions;
    addReceivedMessage({
      id,
      content: text,
      user: { id: userId, name: 'User ' + userId },
    });
  },
  'chat:edited': (_payload) => {
    // const { messageId, newText } = payload;
    // updateMessageWithEdits(messageId, newText);
  },
  'chat:typing': (_payload) => {
    // const { roomId, userId, isTyping } = payload;
    // updateIsTypingStatus(roomId, userId, isTyping);
  },
} as const satisfies ChatHandlerMap;
```

**File:** `frontend/src/system/handlers.ts`

**Apply same pattern:**
```typescript
import type { HandlerMap } from '../../../common/src';
import type { SystemServerMessage } from '../../../common/src/system/server-messages';
import { systemActions } from './actions';

type SystemHandlerMap = HandlerMap<SystemServerMessage>;

export const systemHandlers = {
  'system:users-for-room': (payload) => {
    systemActions.setUsersForRoom(payload.roomId, payload.users);
  },
} as const satisfies SystemHandlerMap;
```

**Why:** Removes mutable registration pattern. Handlers are now just data, imported by bootstrap.

---

### 5. Create bootstrap module

**File:** `frontend/src/ws/bootstrap.ts` (new file)

This module also defines a tiny `assertHandlersInitializedInDev` helper that only runs in development builds to confirm the merged handler map made it into the client even when TypeScript coverage is skipped.

```typescript
import type { AppIncomingMessage, AppOutgoingMessage } from './types';
import type { HandlerMap } from '../../../common/src/utils/message-helpers';

import { WSClient } from './client';
import { chatHandlers } from '../chat/handlers';
import { systemHandlers } from '../system/handlers';
import { initChatWsEffects, resetChatWsEffectsForTests } from '../chat/ws-effects';
import { initSystemWsEffects, resetSystemWsEffectsForTests } from '../system/ws-effects';

const WEBSOCKET_URL = 'ws://localhost:3000';

let wsClient: WSClient<AppIncomingMessage, AppOutgoingMessage> | null = null;

export function initializeWsApp(): WSClient<AppIncomingMessage, AppOutgoingMessage> {
  if (wsClient) {
    return wsClient;
  }

  // Merge all domain handlers - compile-time completeness check
  const allHandlers = {
    ...chatHandlers,
    ...systemHandlers,
  } satisfies HandlerMap<AppIncomingMessage>;

  // Create client with all handlers upfront
  wsClient = new WSClient<AppIncomingMessage, AppOutgoingMessage>({
    url: WEBSOCKET_URL,
    handlers: allHandlers,
  });

  // Wire up ws-effects after client exists
  initChatWsEffects(wsClient);
  initSystemWsEffects(wsClient);

  if (import.meta.env.DEV) {
    assertHandlersInitializedInDev(wsClient, allHandlers);
  }

  // Connect once
  wsClient.connect();

  return wsClient;
}

export function getWsClient(): WSClient<AppIncomingMessage, AppOutgoingMessage> {
  if (!wsClient) {
    throw new Error('WS client not initialized. Call initializeWsApp() first.');
  }
  return wsClient;
}

// For tests
export function resetWsInitializationForTests(): void {
  wsClient?.disconnect();
  wsClient = null;
  resetChatWsEffectsForTests();
  resetSystemWsEffectsForTests();
}

function assertHandlersInitializedInDev(
  client: WSClient<AppIncomingMessage, AppOutgoingMessage>,
  expected: HandlerMap<AppIncomingMessage>,
): void {
  (Object.keys(expected) as Array<keyof HandlerMap<AppIncomingMessage>>).forEach((type) => {
    if (!client.getHandler(type)) {
      throw new Error(`Expected WebSocket handler for message type "${String(type)}" to be registered`);
    }
  });
}
```

`resetWsInitializationForTests()` now clears the client singleton and the ws-effects DI hooks, so Jest/Playwright suites can spin the bootstrap up and down without sharing state.

**Why:**
- Single source of truth for initialization
- `satisfies HandlerMap<AppIncomingMessage>` enforces compile-time completeness
- Clear initialization order: handlers → client → effects → connect
- `assertHandlersInitializedInDev` keeps a dev-time tripwire for cases where TypeScript coverage is bypassed (dynamic imports, incremental builds, etc.)

---

### 6. Update App.tsx

**File:** `frontend/src/App.tsx`

**Before:**
```typescript
import { ChatContainer } from './pages/chat-page/chat-container';
import { ChatProvider } from './chat/provider';

function App() {
  return (
    <ChatProvider>
      <ChatContainer />
    </ChatProvider>
  );
}

export { App };
```

**After:**
```typescript
import { useEffect } from 'react';
import { ChatContainer } from './pages/chat-page/chat-container';
import { initializeWsApp } from './ws/bootstrap';

function App() {
  useEffect(() => {
    initializeWsApp();
    // No cleanup - app-level singleton lifecycle
  }, []);

  return <ChatContainer />;
}

export { App };
```

_React runs parent effects before child effects, so `ChatContainer` will only see a configured client. The `_client` guard inside each ws-effects module stays as a defensive fallback in case that sequencing ever changes._

**Why:** ChatProvider is no longer needed; direct initialization is clearer.

---

### 7. Delete obsolete files

**Files to delete:**
- `frontend/src/chat/provider.tsx` - no longer needed
- `frontend/src/chat/init.ts` - replaced by bootstrap
- `frontend/src/ws/create-client.ts` - client creation moved to bootstrap
- `frontend/src/ws/use-ws-client.ts` - conflicting lifecycle, components use actions not client directly

**Why:** These files either duplicate bootstrap functionality or create lifecycle conflicts.

---

### 8. Update imports throughout codebase

Search and replace any remaining imports of:
- `getWsClient()` from `create-client.ts` → import from `bootstrap.ts`
- `connectWsClient()` calls → should not exist (bootstrap handles it)
- `registerChatHandlers()` / `registerSystemHandlers()` → should not exist

**Check:**
```bash
grep -r "from.*create-client" frontend/src
grep -r "registerChatHandlers\|registerSystemHandlers" frontend/src
```

---

## Migration Checklist

- [ ] Step 1: Fix `ServerMessageType` union bug
- [ ] Step 2: Add compile-time array validation to message files
- [ ] Step 3: Refactor `chat/ws-effects.ts` with DI
- [ ] Step 4: Refactor `system/ws-effects.ts` with DI
- [ ] Step 5: Update `chat/handlers.ts` to export const
- [ ] Step 6: Update `system/handlers.ts` to export const
- [ ] Step 7: Create `ws/bootstrap.ts`
- [ ] Step 8: Update `App.tsx`
- [ ] Step 9: Delete `chat/provider.tsx`
- [ ] Step 10: Delete `chat/init.ts`
- [ ] Step 11: Delete `ws/create-client.ts`
- [ ] Step 12: Delete `ws/use-ws-client.ts`
- [ ] Step 13: Update any remaining imports
- [ ] Step 14: Test Strict Mode (no duplicate connects)
- [ ] Step 15: Test compilation fails if handler removed

## Benefits Over v1

1. **Compile-time completeness** - No need for runtime validator; TypeScript fails build if handlers incomplete
2. **No circular dependency** - DI in ws-effects only; minimal refactoring needed
3. **Simpler** - Fewer abstractions (no `DomainHandlerMap` type, no validator module, no ChatProvider)
4. **Safer** - Fixes critical bugs (ServerMessageType, useWsClient conflicts)
5. **Immutable client** - Handlers set at construction, not mutated later
6. **Type-safe arrays** - Compile-time assertion keeps arrays in sync with types

## Potential Issues / Mitigations

- **Strict Mode double-invocation**: Handled by `wsClient` null check in bootstrap
- **New domains**: Must export handlers const and init function for ws-effects; bootstrap merges them
- **Tests**: Use `resetWsInitializationForTests()` (which now calls `resetChatWsEffectsForTests()` / `resetSystemWsEffectsForTests()`) so each test starts without lingering DI
- **Unknown message types**: Existing `dispatch` behavior preserved (logs error, client.ts:207)

## Validation

**Manual test:**
1. Remove a handler (e.g., delete `'chat:typing'` from `chatHandlers`)
2. Run `npm run build`
3. Should get TypeScript error: "Type '...' does not satisfy 'HandlerMap<AppIncomingMessage>'"

**Array sync test:**
1. Add `'chat:deleted'` to `chatServerMessageTypes` array but not to `ChatServerPayloadMap`
2. Run `npm run build`
3. Should get TypeScript error on `_checkChatMessageTypesComplete`

**Runtime assertion test (dev only):**
1. Temporarily comment out the `initializeWsApp()` call in `App.tsx`
2. Run `npm run dev`
3. Navigating to the app should throw the `assertHandlersInitializedInDev` error, proving the guard is wired.

_Test suites that spin bootstrap up multiple times should call `resetWsInitializationForTests()` (and, if they interact with effects directly, the exported `reset*WsEffectsForTests()` helpers) in their setup/teardown hooks._

## Open Questions

None - v2 plan addresses all issues found in technical review.

---

**Next action:** Review v2 plan, then implement steps in order.
