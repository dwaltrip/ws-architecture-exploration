# Backend WS Refactor Plan

Project: This is a demo app for exploring and iterating on my ws architecture that I will use in my game (separate repo).

## Context & Goals
- Align backend message handling with frontend patterns to simplify mental model.
- Remove thin service classes in favour of plain functions/actions that can be reused outside WS handlers.
- Introduce a minimal fake persistence layer per domain while keeping the demo lightweight and easy to iterate on.
- Improve compile-time safety for handler registration to catch gaps before runtime.
- Minimize / avoid complex wiring (e.g. fancy DI, action registry), preferring explicit when possible.

## Key Assumptions
- Each domain owns its own fake persistence helpers; cross-domain imports happen through explicit wiring instead of a shared singleton.
- `RoomManager` continues living under `src/ws` as a transport-level utility—it manages ephemeral subscriptions tied to active WebSocket connections, not persistent business-level membership.
- In-memory data structures are acceptable (single-process demo, no durability requirements).
- This is a synchronous demo app with no database or external API calls, so all WS operations (broadcast, handlers, actions) are synchronous.
- Actions are decoupled from WebSocket handler execution by importing a shared `wsBridge` singleton (analogous to frontend's ws-effects pattern). This allows actions to be called from HTTP endpoints, tests, or other orchestrators without constructing handler context.
- We extend the shared message helper module (`common/src/utils/message-helpers.ts`) with backend-specific handler types so the transport context stays typed without reimplementing unions. These types will live alongside frontend types in `common/` for now and can be refactored later if needed.

## Proposed Structure

### Directory Layout
```
backend/src/
  db/
    chat-store.ts
    timer-store.ts
  domains/
    chat/
      actions.ts
      handlers.ts
      index.ts
    system/
      actions.ts
      handlers.ts
      index.ts
    timer/
      actions.ts
      handlers.ts
      index.ts
  ws/
    bridge.ts
    room-manager.ts
    server.ts
    types.ts
  server.ts
```

- `db/*` exports the fake persistence helpers (in-memory Maps/Sets) with simple CRUD functions that domains can import directly.
- `ws/bridge.ts` exports a shared `wsBridge` singleton that provides broadcast capabilities and room adapter. Initialized once at server startup.
- `domains/*` host module-level stores, action sets, and strongly-typed handlers. Actions import `wsBridge` for transport operations and take payload data plus an optional minimal caller context (e.g., `{ userId }`) instead of the full handler object.
- `server.ts` boots the WS server, builds a single handler object that satisfies `HandlerMapWithCtx<ClientMessage, HandlerContext>`, creates the server, initializes `wsBridge`, and starts accepting connections.

### Dependency Flow
1. Stores (state) live in `db/*`; domains import them directly and maintain module-level in-memory data.
2. Each domain exposes actions that accept payload data and, when available, an optional minimal caller context (`{ userId? }`). Actions import `wsBridge` to access transport operations like `broadcastToRoom`. Actions are reusable by any caller—WS handlers, HTTP endpoints, tests, etc.
3. Domain handlers satisfy `HandlerMapWithCtx<DomainClientMessage, HandlerContext>`, extract the minimal context they need, and pass it into actions. Handlers are kept thin—domain logic and broadcast decisions live in actions.
4. `createWSServer` consumes the handler map and returns an object with `handleConnection` plus broadcast methods. At server startup, these methods are injected into `wsBridge` via `wsBridge.init()`.

This mirrors the frontend pattern: stores and actions exist independently, the WS bridge is initialized once at startup, and actions import the bridge singleton to access transport capabilities.

### System Domain Details
- `domains/system` keeps demo-specific logic for room membership, user list broadcasts, and any onboarding/system notifications.
- Actions use `wsBridge.get().rooms` for room operations (`{ join, leave, getMembers, isMember }`) and `wsBridge.get().broadcastToRoom` for user list broadcasts.
- The domain is responsible for broadcasting roster updates (e.g. `system:users-for-room`) after calling the room adapter so any orchestrator invoking the action observes the same side effects.
- TODO: keep server-owned disconnect cleanup for now, but evaluate surfacing domain-level disconnect notifications once the new structure settles.
- Handlers for `system:room-join` and `system:room-leave` move out of `createWSServer`, giving us compile-time guarantees and keeping the transport focused on routing.
- Future system messages (presence, pings, metadata) can reuse the same action set without touching the websocket server core.

### WS Bridge Pattern
- The `wsBridge` singleton provides a shared interface for all domains to access transport capabilities without coupling actions to handler execution context.
- Bridge API includes:
  - `broadcast(message, opts?)` - broadcast to all connected clients with optional `{ excludeUserId?: string }`
  - `broadcastToRoom(roomId, message, opts?)` - broadcast to room members with optional `{ excludeUserId?: string }`
  - `sendToUser(userId, message)` - direct message utility for one-off notifications
  - `rooms` - room membership adapter with `{ join, leave, getMembers, isMember }`
- All domains import the same bridge; domains that don't need room operations simply don't use the `rooms` property.
- The bridge is initialized once in `server.ts` after creating the WS server, before accepting connections.
- This mirrors the frontend ws-effects pattern: actions import a singleton that's injected with transport capabilities at startup.
- For testing, the bridge can be mocked or initialized with test implementations.

### Error Handling Strategy
- Keep error handling simple for this demo: actions and handlers throw on errors, which are caught and logged by the WS server.
- No error messages are sent back to clients—errors just log server-side and the handler execution stops.
- `broadcastToRoom` will throw if the room doesn't exist (helps catch bugs during development).
- This approach is suitable for a demo; a production app would want structured error responses, client notifications, and retry logic.

### Typing Strategy
- Extend `common/src/utils/message-helpers.ts` with backend-aware helpers: `MessageHandlerWithCtx<TUnion, TCtx>`, `HandlerMapWithCtx<TUnion, TCtx>`, and (optionally) `mergeHandlerMapsWithCtx` for future reuse. Frontend code continues to rely on the payload-only `HandlerMap`.
- `createWSServer` accepts `HandlerMapWithCtx<ClientMessage, HandlerContext>` and returns transport helpers:
  ```ts
  type BroadcastOptions = { excludeUserId?: string };

  export function createWSServer(
    handlers: HandlerMapWithCtx<ClientMessage, HandlerContext>
  ): {
    handleConnection(socket: WebSocket, userId: string, username: string): void;
    broadcast(message: ServerMessage, opts?: BroadcastOptions): void;
    broadcastToRoom(roomId: string, message: ServerMessage, opts?: BroadcastOptions): void;
    sendToUser(userId: string, message: ServerMessage): void;
    rooms: RoomMembershipAdapter;
  };
  ```
  Note: All operations are synchronous (no Promises/async) since this demo has no database or external API calls. `broadcastToRoom` will throw if the room doesn't exist. `RoomManager` is created internally; the `rooms` adapter is returned for `wsBridge` initialization and exposed via `HandlerContext.rooms` to each handler.
- Domain handler modules export literals that satisfy `HandlerMapWithCtx<ChatClientMessage, HandlerContext>`, extract minimal parameters from context, and invoke actions.
- Drop `createHandlerMap` (and avoid `mergeHandlerMaps`) so we lean on object literals plus the `satisfies` operator—this catches typos or missing message keys at compile time in the same way the frontend bootstrap currently does.

### Example Store & Domain Wiring

```ts
// backend/src/ws/bridge.ts
import type { ServerMessage } from '../../../common/src';

type BroadcastOptions = { excludeUserId?: string };

interface RoomMembershipAdapter {
  join(roomId: string, userId: string): void;
  leave(roomId: string, userId: string): void;
  getMembers(roomId: string): Set<string> | null;
  isMember(roomId: string, userId: string): boolean;
}

interface WsTransport {
  broadcast(message: ServerMessage, opts?: BroadcastOptions): void;
  broadcastToRoom(roomId: string, message: ServerMessage, opts?: BroadcastOptions): void;
  sendToUser(userId: string, message: ServerMessage): void;
  rooms: RoomMembershipAdapter;
}

let transport: WsTransport | null = null;

export const wsBridge = {
  init(impl: WsTransport) {
    transport = impl;
  },
  get(): WsTransport {
    if (!transport) {
      throw new Error('WS bridge not initialized');
    }
    return transport;
  },
};
```

```ts
// backend/src/db/chat-store.ts
import type { ChatMessageBroadcastPayload } from '../../../common/src';

type ChatStore = {
  save(message: ChatMessageBroadcastPayload): void;
  find(id: string): ChatMessageBroadcastPayload | undefined;
  update(id: string, fields: Partial<ChatMessageBroadcastPayload>): ChatMessageBroadcastPayload | undefined;
  reset(): void;
};

export function createChatStore(): ChatStore {
  const messages = new Map<string, ChatMessageBroadcastPayload>();
  return {
    save(message) {
      messages.set(message.id, message);
    },
    find: (id) => messages.get(id),
    update(id, fields) {
      const existing = messages.get(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...fields };
      messages.set(id, updated);
      return updated;
    },
    reset() {
      messages.clear();
    },
  }; 
}
```

```ts
// backend/src/domains/chat/store-singleton.ts
import { createChatStore } from '../../db/chat-store';

export const chatStore = createChatStore();
export function resetChatStoreForTests() {
  chatStore.reset();
}
```

```ts
// backend/src/domains/chat/actions.ts
import type { ChatSendPayload, ChatTypingStatePayload } from '../../../common/src';
import { ChatMessageBuilders } from './message-builders';
import { chatStore } from './store-singleton';
import { wsBridge } from '../../ws/bridge';

type UserContext = { userId: string; }

export const chatActions = {
  sendMessage(payload: ChatSendPayload, ctx?: UserContext) {
    const message = {
      id: `msg-${Date.now()}`,
      roomId: payload.roomId,
      text: payload.text.trim(),
      userId: ctx?.userId ?? 'unknown-user', // fallback for callers without user context
      username: ctx?.username ?? 'anonymous-user',
      timestamp: Date.now(),
    };

    chatStore.save(message);
    wsBridge.get().broadcastToRoom(message.roomId, ChatMessageBuilders.message(message));
    return message;
  },

  setTypingState(payload: ChatTypingStatePayload, ctx?: UserContext) {
    const typingBroadcast = {
      roomId: payload.roomId,
      userIds: ctx?.userId ? [ctx.userId] : [],
    };

    const opts = ctx?.userId ? { excludeUserId: ctx.userId } : undefined; // only exclude when invoked from a WS handler

    wsBridge.get().broadcastToRoom(
      payload.roomId,
      ChatMessageBuilders.typing(typingBroadcast),
      opts,
    );
    return typingBroadcast;
  },
};
```

Actions only opt into exclusion when a caller context is provided, so tests or HTTP endpoints can reuse the same functions without stubbing connection metadata.

```ts
// backend/src/domains/chat/handlers.ts
import type { ChatClientMessage } from '../../../common/src';
import type { HandlerMapWithCtx } from '../../../common/src/utils/message-helpers';
import type { HandlerContext } from '../../ws/types';
import { chatActions } from './actions';

export const chatHandlers = {
  'chat:send': (payload, ctx) => {
    chatActions.sendMessage(payload, { userId: ctx.userId });
  },
  'chat:typing': (payload, ctx) => {
    chatActions.setTypingState(payload, { userId: ctx.userId });
  },
  // ...other handlers
} satisfies HandlerMapWithCtx<ChatClientMessage, HandlerContext>;
```

```ts
// backend/src/server.ts (excerpt)
import { chatHandlers } from './domains/chat';
import { systemHandlers } from './domains/system';
import { timerHandlers } from './domains/timer';
import { wsBridge } from './ws/bridge';

const handlers = {
  ...chatHandlers,
  ...systemHandlers,
  ...timerHandlers,
} satisfies HandlerMapWithCtx<ClientMessage, HandlerContext>;

const server = createWSServer(handlers);

// Initialize the bridge with transport capabilities
wsBridge.init({
  broadcast: server.broadcast,
  broadcastToRoom: server.broadcastToRoom,
  sendToUser: server.sendToUser,
  rooms: server.rooms,
});

const wss = new WebSocketServer({ port });
wss.on('connection', (socket, req) => {
  const userId = extractUserIdFromRequest(req);
  const username = `user-${userId.slice(0, 8)}`;
  server.handleConnection(socket, userId, username);
});
```

## Tradeoffs & Constraints
- **Pros:** clearer separation of concerns, actions decoupled from handler execution (testable without WS infrastructure), better type safety via `satisfies`, strong parity with frontend design (mirrors ws-effects pattern), handlers stay thin with logic in actions.
- **Cons:** more files than the current approach; slightly higher upfront complexity for a small demo. Module-level singletons (stores + bridge) require manual reset/mocking in tests, but this is acceptable for a demo focused on architecture exploration.
- **Neutral decisions:** keeping `RoomManager` under `ws/` reflects its role managing ephemeral connection-based subscriptions; shared bridge (vs per-domain bridges) trades explicitness for simplicity; synchronous-only design is appropriate given no I/O.

## Implementation Phases
1. **Type Helpers:** extend `common/src/utils/message-helpers.ts` with the backend `*WithCtx` helpers and prune `createHandlerMap`/`mergeHandlerMaps` once nothing references them.
2. **WS Bridge:** create `backend/src/ws/bridge.ts` with the shared singleton, `BroadcastOptions` shape, and `WsTransport` interface exposing `{ broadcast, broadcastToRoom, sendToUser, rooms }`.
3. **Scaffold Stores:** move `chat/service.ts` and `timer/service.ts` data into `db` modules, expose factory + `reset` helpers, and move typing store from `chat/fake-db.ts` into `db/chat-typing-store.ts` (or similar).
4. **Domain Modules:** in `domains/chat`, `domains/system`, and `domains/timer`, stand up store singletons, action sets (importing `wsBridge`, accepting payload data plus optional caller context), and strongly-typed handler maps (using `HandlerMapWithCtx`) that extract context and delegate to actions.
5. **Server Composition:** refactor `server.ts` to build the merged handler object with `satisfies HandlerMapWithCtx`, update `createWSServer` signature to remove async, and initialize `wsBridge` after creating the server.
6. **Cleanup & Verification:** remove old service classes, update imports, ensure all async/await is removed, add any logging adjustments, and run smoke tests (start backend + frontend, send messages, start/pause timer).

## Resolved Decisions
- **Action reusability**: Actions import the `wsBridge` singleton, take payload data plus an optional minimal caller context, and stay decoupled from handler execution. They remain callable from any context (WS handlers, HTTP endpoints, tests).
- **WS Bridge pattern**: Shared `wsBridge` singleton (not per-domain bridges) provides transport capabilities to all domains. Mirrors frontend ws-effects pattern. Initialized once at server startup.
- **Handler role**: Handlers extract minimal params from `HandlerContext` and pass to actions. Handlers stay thin, no business logic.
- **Error handling**: Simple throw-and-log approach for demo purposes. No error messages to clients.
- **Async/sync**: Everything is synchronous. No database or API calls in this demo.
- **Store pattern**: Module-level singletons with reset helpers. Simple and appropriate for a demo.
- **Broadcast options**: Actions decide whether to set `excludeUserId` via the bridge, keeping transport-specific decisions out of handlers while avoiding implicit per-connection state.

## Open Questions
- What is the right hook for propagating disconnect-driven room leaves into the system domain? (TODO captured above; revisit after the initial refactor.)

## Next Steps
- Land the shared helper updates in `common/src/utils/message-helpers.ts` (add `*WithCtx`, remove unused helpers) so backend typing changes compile cleanly.
- Create `ws/bridge.ts` with the shared singleton pattern, `BroadcastOptions`, and the full `{ broadcast, broadcastToRoom, sendToUser, rooms }` surface.
- Update `createWSServer` signature to remove async/Promise, return the `rooms` adapter, and implement the new options-aware broadcast helpers.
- Prototype the chat domain end-to-end (db store → store singleton → actions using wsBridge with optional caller context → handlers extracting params), then mirror the pattern in system and timer.
- Update server.ts to use flat handler spread with `satisfies` and initialize `wsBridge` after server creation, verify compile-time type safety catches missing handlers.
