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
- Future experiments may want to call domain actions from HTTP endpoints, tests, or other orchestrators (e.g., HTTP endpoint that broadcasts to a room), so actions accept `HandlerContext` which can be constructed by any caller with access to WS infrastructure.
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
    (RoomManager remains here)
  server.ts
```

- `db/*` exports the fake persistence helpers (in-memory Maps/Sets) with simple CRUD functions that domains can import directly.
- `domains/*` host module-level stores, action sets, and strongly-typed handlers. Actions receive `HandlerContext` which provides all WS helpers, so no separate bridge/wiring is needed.
- `server.ts` boots the WS server, builds a single handler object that satisfies `HandlerMapWithCtx<ClientMessage, HandlerContext>`, and passes it to `createWSServer`. The server creates `HandlerContext` per connection with all transport helpers baked in.
- `domains/system` wraps room join/leave flows using the room adapter available in `HandlerContext.rooms`.

### Dependency Flow
1. Stores (state) live in `db/*`; domains import them directly and maintain module-level in-memory data.
2. Each domain exposes actions that accept `HandlerContext` (containing `userId`, `username`, and all WS helpers). Actions are reusable by any caller that can provide this context (WS handlers, HTTP endpoints, tests, etc.).
3. Domain handlers satisfy `HandlerMapWithCtx<DomainClientMessage, HandlerContext>` and directly invoke actions, passing through the full context. Handlers are kept thin—domain logic and decisions about broadcast behavior (e.g., `excludeSelf`) live in actions.
4. `createWSServer` consumes that single handler map, owns transport-level wiring, and exposes the broadcast helpers and room adapter for domain use.

This mirrors the frontend, where stores and actions exist independently of the WS client and handlers, and WS effects inject the client once ready.

### System Domain Details
- `domains/system` keeps demo-specific logic for room membership, user list broadcasts, and any onboarding/system notifications.
- Actions use the room adapter from `HandlerContext.rooms` (`{ join, leave, getMembers, isMember }`) and broadcast helpers from the same context.
- The domain is responsible for broadcasting roster updates (e.g. `system:users-for-room`) after calling the room adapter so any orchestrator invoking the action observes the same side effects.
- TODO: keep server-owned disconnect cleanup for now, but evaluate surfacing domain-level disconnect notifications once the new structure settles.
- Handlers for `system:room-join` and `system:room-leave` move out of `createWSServer`, giving us compile-time guarantees and keeping the transport focused on routing.
- Future system messages (presence, pings, metadata) can reuse the same action set without touching the websocket server core.

### HandlerContext Considerations
- Keep `HandlerContext.rooms` for now so any domain can access room membership without wiring extra dependencies—this matches the connection-centric nature of room state.
- Continue exposing the full transport-level helpers (`send`, `broadcast`, `broadcastToRoom`) plus `userId` and `username` to all actions; actions can ignore what they don't need, and having full access allows flexibility as features evolve.
- If we later move `RoomManager` behind a store, we can still implement `HandlerContext.rooms` on top of that store, so existing domains remain unaffected.
- Actions receive the full `HandlerContext` directly from handlers—no mapping layer. This keeps handlers thin and acknowledges that actions are tied to WS infrastructure (they need transport helpers to do their work).

### Error Handling Strategy
- Keep error handling simple for this demo: actions and handlers throw on errors, which are caught and logged by the WS server.
- No error messages are sent back to clients—errors just log server-side and the handler execution stops.
- `broadcastToRoom` will throw if the room doesn't exist (helps catch bugs during development).
- This approach is suitable for a demo; a production app would want structured error responses, client notifications, and retry logic.

### Typing Strategy
- Extend `common/src/utils/message-helpers.ts` with backend-aware helpers: `MessageHandlerWithCtx<TUnion, TCtx>`, `HandlerMapWithCtx<TUnion, TCtx>`, and (optionally) `mergeHandlerMapsWithCtx` for future reuse. Frontend code continues to rely on the payload-only `HandlerMap`.
- `createWSServer` accepts `HandlerMapWithCtx<ClientMessage, HandlerContext>` and returns transport helpers:
  ```ts
  export function createWSServer(
    handlers: HandlerMapWithCtx<ClientMessage, HandlerContext>
  ): {
    handleConnection(socket: WebSocket, userId: string, username: string): void;
    broadcast(message: ServerMessage, excludeSelf?: boolean): void;
    broadcastToRoom(roomId: string, message: ServerMessage, excludeSelf?: boolean): void;
    sendToUser(userId: string, message: ServerMessage): void;
  };
  ```
  Note: All operations are synchronous (no Promises/async) since this demo has no database or external API calls. `broadcastToRoom` will throw if the room doesn't exist. `RoomManager` is created internally and exposed via `HandlerContext.rooms` to each handler.
- Domain handler modules export literals that satisfy `HandlerMapWithCtx<ChatClientMessage, HandlerContext>` and directly invoke actions, passing through the full `HandlerContext`.
- Drop `createHandlerMap` (and avoid `mergeHandlerMaps`) so we lean on object literals plus the `satisfies` operator—this catches typos or missing message keys at compile time in the same way the frontend bootstrap currently does.

### Example Store & Domain Wiring
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
import type { HandlerContext } from '../../ws/types';
import { ChatMessageBuilders } from './message-builders';
import { chatStore } from './store-singleton';

export const chatActions = {
  sendMessage(payload: ChatSendPayload, ctx: HandlerContext) {
    const message = {
      id: `msg-${Date.now()}`,
      roomId: payload.roomId,
      text: payload.text.trim(),
      userId: ctx.userId,
      username: ctx.username,
      timestamp: Date.now(),
    };

    chatStore.save(message);
    // Actions control excludeSelf - chat messages include sender
    ctx.broadcastToRoom(message.roomId, ChatMessageBuilders.message(message));
    return message;
  },

  setTypingState(payload: ChatTypingStatePayload, ctx: HandlerContext) {
    // Update typing state in store...
    const typingBroadcast = { roomId: payload.roomId, userIds: [ctx.userId] };

    // Actions control excludeSelf - typing indicators exclude sender
    ctx.broadcastToRoom(
      payload.roomId,
      ChatMessageBuilders.typing(typingBroadcast),
      true  // excludeSelf
    );
    return typingBroadcast;
  },
};
```

```ts
// backend/src/domains/chat/handlers.ts
import type { ChatClientMessage } from '../../../common/src';
import type { HandlerMapWithCtx } from '../../../common/src/utils/message-helpers';
import type { HandlerContext } from '../../ws/types';
import { chatActions } from './actions';

export const chatHandlers = {
  'chat:send': (payload, ctx) => {
    chatActions.sendMessage(payload, ctx);
  },
  'chat:typing': (payload, ctx) => {
    chatActions.setTypingState(payload, ctx);
  },
  // ...other handlers
} satisfies HandlerMapWithCtx<ChatClientMessage, HandlerContext>;
```

```ts
// backend/src/server.ts (excerpt)
import { chatHandlers } from './domains/chat';
import { systemHandlers } from './domains/system';
import { timerHandlers } from './domains/timer';

const handlers = {
  ...chatHandlers,
  ...systemHandlers,
  ...timerHandlers,
} satisfies HandlerMapWithCtx<ClientMessage, HandlerContext>;

const server = createWSServer(handlers);

const wss = new WebSocketServer({ port });
wss.on('connection', (socket, req) => {
  const userId = extractUserIdFromRequest(req);
  const username = `user-${userId.slice(0, 8)}`;
  server.handleConnection(socket, userId, username);
});
```

## Tradeoffs & Constraints
- **Pros:** clearer separation of concerns, easier to test actions (just provide a mock HandlerContext), better type safety via `satisfies`, closer parity with frontend design, handlers stay thin with logic in actions.
- **Cons:** more files than the current approach; slightly higher upfront complexity for a small demo. Module-level store singletons require manual reset in tests, but this is acceptable for a demo focused on architecture exploration rather than comprehensive test coverage.
- **Neutral decisions:** keeping `RoomManager` under `ws/` reflects its role managing ephemeral connection-based subscriptions; actions receiving full `HandlerContext` trades minimal surface area for simplicity and flexibility; synchronous-only design is appropriate given no I/O.

## Implementation Phases
1. **Type Helpers:** extend `common/src/utils/message-helpers.ts` with the backend `*WithCtx` helpers and prune `createHandlerMap`/`mergeHandlerMaps` once nothing references them.
2. **Scaffold Stores:** move `chat/service.ts` and `timer/service.ts` data into `db` modules, expose factory + `reset` helpers, and move typing store from `chat/fake-db.ts` into `db/chat-typing-store.ts` (or similar).
3. **Domain Modules:** in `domains/chat`, `domains/system`, and `domains/timer`, stand up store singletons, action sets (accepting `HandlerContext`), and strongly-typed handler maps (using `HandlerMapWithCtx`) that pass context directly to actions.
4. **Server Composition:** refactor `server.ts` to build the merged handler object with `satisfies HandlerMapWithCtx`, and update `createWSServer` signature to remove async (make all operations synchronous).
5. **Cleanup & Verification:** remove old service classes, update imports, ensure all async/await is removed, add any logging adjustments, and run smoke tests (start backend + frontend, send messages, start/pause timer).

## Resolved Decisions
- **Action reusability**: Actions accept `HandlerContext` and can be called from any source that can construct this context (WS handlers, HTTP endpoints, tests). This balances reusability with simplicity.
- **Context mapping**: No mapping layer—handlers pass `HandlerContext` directly to actions. Actions receive full context and ignore what they don't need, allowing flexibility as features evolve.
- **Error handling**: Simple throw-and-log approach for demo purposes. No error messages to clients.
- **Async/sync**: Everything is synchronous. No database or API calls in this demo.
- **Store pattern**: Module-level singletons with reset helpers. Simple and appropriate for a demo.
- **excludeSelf control**: Actions decide whether to exclude sender, keeping business logic out of handlers.

## Open Questions
- What is the right hook for propagating disconnect-driven room leaves into the system domain? (TODO captured above; revisit after the initial refactor.)

## Next Steps
- Land the shared helper updates in `common/src/utils/message-helpers.ts` (add `*WithCtx`, remove unused helpers) so backend typing changes compile cleanly.
- Update `createWSServer` signature to remove async/Promise, ensure `HandlerContext` includes all needed helpers.
- Prototype the chat domain end-to-end (db store → store singleton → actions → handlers), then mirror the pattern in system and timer.
- Update server.ts to use flat handler spread with `satisfies`, verify compile-time type safety catches missing handlers.
