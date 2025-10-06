# Backend WS Refactor Plan

## Context & Goals
- Align backend message handling with frontend patterns to simplify mental model.
- Remove thin service classes in favour of plain functions/actions that can be reused outside WS handlers.
- Introduce a minimal fake persistence layer per domain while keeping the demo lightweight and easy to iterate on.
- Improve compile-time safety for handler registration to catch gaps before runtime.

## Key Assumptions
- Each domain owns its own fake persistence helpers; cross-domain imports happen through explicit wiring instead of a shared singleton.
- `RoomManager` continues living under `src/ws` as a transport-level utility.
- In-memory data structures are acceptable (single-process demo, no durability requirements).
- Future experiments may want to call domain actions from HTTP endpoints, tests, or other orchestrators, so actions should be injectable and not tightly coupled to WS handler creation.
- We can reuse shared message helper types from `common/src/utils/message-helpers.ts` to enforce handler completeness.

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

- `db/*` exports the fake persistence helpers (in-memory Maps/Sets) with simple CRUD functions.
- `domains/*` exports factories like `createChatDomain(deps)`, returning `{ actions, handlers }`.
- `server.ts` composes domains by instantiating stores once, passing them into domain factories, and merging handler maps.
- `domains/system` wraps room join/leave flows while depending on an adapter around `RoomManager` supplied by the WS layer.

### Dependency Flow
1. Stores (state) live in `db/*`. They expose plain functions and types but hold the in-memory data.
2. Domain factories receive the required store functions and return:
   - `actions`: callable from WS handlers *and* other orchestration layers (tests, future HTTP).
   - `handlers`: strongly-typed `HandlerMap` built from `actions` and message builders.
3. `createWSServer` receives a merged `HandlerMap` and is responsible only for transport concerns (connection lifecycle, routing by `type`).
4. The system domain uses the injected room adapter to manage membership events, so the transport no longer hardcodes system message handling.

This mirrors the frontend, where stores and actions exist independently of the WS client and handlers, and WS effects inject the client once ready.

### System Domain Details
- `domains/system` keeps demo-specific logic for room membership, user list broadcasts, and any onboarding/system notifications.
- The domain factory receives the `RoomManager` adapter (`{ join, leave, getMembers, isMember }`) from the transport layer and reuses it inside actions.
- Handlers for `system:room-join` and `system:room-leave` move out of `createWSServer`, giving us the same compile-time guarantees and keeping the transport focused on routing.
- Future system messages (presence, pings, metadata) can share the same action set without touching the websocket server core.

### HandlerContext Considerations
- Keep `HandlerContext.rooms` for now so any domain can access room membership without wiring extra dependencies—this matches the connection-centric nature of room state.
- Continue exposing transport-level helpers (`send`, `broadcast`, `broadcastToRoom`) plus `userId` and `username`; domains remain free to ignore what they don’t need.
- If we later move `RoomManager` behind a store, we can still implement `HandlerContext.rooms` on top of that store, so existing domains remain unaffected.

### Typing Strategy
- Replace the backend `GenericHandler` map with the shared `HandlerMap` type from `common`. Example signature:
  ```ts
  export function createWSServer(handlers: HandlerMap<ServerMessage>) { /* ... */ }
  ```
- Domain handler creation uses the same helper:
  ```ts
  const chatHandlers = createHandlerMap<ChatServerMessage>({
    'chat:message': (payload) => { /* ... */ },
    'chat:edited': (payload) => { /* ... */ },
    'chat:is-typing-in-room': (payload) => { /* ... */ },
  });
  ```
- `server.ts` merges handler maps at compile time using a utility similar to the frontend’s `mergeHandlerMaps` to ensure no duplicate keys or missing cases.

### Example Store & Domain Factories
```ts
// backend/src/db/chat-store.ts
import type { ChatMessageBroadcastPayload } from '../../common/src';

type ChatStore = {
  save(message: ChatMessageBroadcastPayload): void;
  find(id: string): ChatMessageBroadcastPayload | undefined;
  update(id: string, fields: Partial<ChatMessageBroadcastPayload>): ChatMessageBroadcastPayload | undefined;
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
  }; 
}
```

```ts
// backend/src/domains/chat/index.ts
import { createHandlerMap } from '../../../common/src/utils/message-helpers';
import { ChatMessageBuilders } from './message-builders';

export function createChatDomain(deps: {
  chatStore: ReturnType<typeof createChatStore>;
  typingStore: ReturnType<typeof createTypingStore>;
}) {
  const actions = createChatActions(deps);

  const handlers = createHandlerMap<ChatClientMessage>({
    'chat:send': (payload, ctx) => {
      const message = actions.sendMessage(payload, ctx);
      ctx.broadcastToRoom(message.roomId, ChatMessageBuilders.message(message));
    },
    // ...other handlers using actions
  });

  return { actions, handlers };
}
```

## Tradeoffs & Constraints
- **Pros:** clearer separation of concerns, easier to test actions without spinning up WS server, better type safety, closer parity with frontend design.
- **Cons:** more files and explicit wiring; slightly higher upfront complexity for a small demo. Fake stores still risk accidental shared state across tests unless reset helpers are provided.
- **Neutral decisions:** keeping `RoomManager` under `ws` while injecting a thin adapter keeps transport concerns centralized without blocking future moves.

## Implementation Phases
1. **Scaffold Stores:** move `chat/service.ts` and `timer/service.ts` data into `db` modules; move typing store from `chat/fake-db.ts` into `db/chat-typing-store.ts` (or similar).
2. **Domain Factories:** create `domains/chat`, `domains/system`, and `domains/timer` with `create*Domain` functions, deriving `actions` from stores/adapters and exporting typed handlers.
3. **Server Composition:** refactor `server.ts` to instantiate stores, build the room adapter, call domain factories, merge handler maps, and pass a single map to `createWSServer`.
4. **Cleanup:** remove old service classes, update imports, ensure exports from domain index files re-export the new factories/actions as needed.
5. **Verification:** manual smoke run (start backend + frontend, send messages, start/pause timer) and possibly a lightweight unit test for actions if time allows.

## Open Questions
- Do we want helper reset functions on stores for tests/dev hot reloads? (Not needed immediately, but easy to add.)
- Long term, do we want a global registry of actions for cross-domain coordination, or keep explicit imports per domain? (Decision for now: stay with explicit imports.)
- At what point should we trim `HandlerContext` if domains only use a subset of helpers? Worth revisiting once more domains and transports exist.

## Next Steps
- Lock in `domains` naming (decision made) and sketch concrete exports for each domain factory.
- Start implementation with the chat domain to validate the pattern, layer in system next, then port timer once the shared pieces feel solid.
- After refactor, revisit logging and ensure it remains informative without spamming.
