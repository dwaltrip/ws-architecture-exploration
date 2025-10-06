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
- `RoomManager` continues living under `src/ws` as a transport-level utility.
- In-memory data structures are acceptable (single-process demo, no durability requirements).
- Future experiments may want to call domain actions from HTTP endpoints, tests, or other orchestrators, so actions should be injectable and not tightly coupled to WS handler creation.
- We extend the shared message helper module (`common/src/utils/message-helpers.ts`) with backend-specific handler types so the transport context stays typed without reimplementing unions.

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
- `domains/*` host module-level stores, action sets, strongly-typed handlers, and a small `ws-bridge` singleton that wires transport primitives in once at bootstrap (mirrors frontend `ws-effects`).
- `server.ts` boots the WS server, builds a single handler object that satisfies `HandlerMapWithCtx<ClientMessage, HandlerContext>`, initializes each domain’s bridge with the transport helpers it exposes (`broadcast`, `broadcastToRoom`, etc.), and passes the handler map into `createWSServer`.
- `domains/system` wraps room join/leave flows while depending on an adapter around `RoomManager` supplied by the WS layer.

### Dependency Flow
1. Stores (state) live in `db/*`; domains import them directly and maintain module-level in-memory data.
2. Each domain exposes actions that accept a minimal action context (`userId`, `username`, ws helpers) supplied by a tiny `ws-bridge` singleton.
3. Domain handlers satisfy `HandlerMapWithCtx<DomainClientMessage, HandlerContext>`, translate the transport `HandlerContext` into an action context, then invoke the shared actions.
4. `createWSServer` consumes that single handler map, owns transport-level wiring, and exposes the broadcast helpers and room adapter that each domain bridge needs while keeping the system adapter separate from domain logic.

This mirrors the frontend, where stores and actions exist independently of the WS client and handlers, and WS effects inject the client once ready.

### System Domain Details
- `domains/system` keeps demo-specific logic for room membership, user list broadcasts, and any onboarding/system notifications.
- Actions import the shared room adapter (`{ join, leave, getMembers, isMember }`) and rely on the system `ws-bridge` for broadcasting, mirroring the other domains.
- The domain is responsible for broadcasting roster updates (e.g. `system:users-for-room`) after it calls the adapter so any orchestrator invoking the action observes the same side effects.
- TODO: keep server-owned disconnect cleanup for now, but evaluate surfacing domain-level disconnect notifications once the new structure settles.
- Handlers for `system:room-join` and `system:room-leave` move out of `createWSServer`, giving us compile-time guarantees and keeping the transport focused on routing.
- Future system messages (presence, pings, metadata) can reuse the same action set without touching the websocket server core.

### HandlerContext Considerations
- Keep `HandlerContext.rooms` for now so any domain can access room membership without wiring extra dependencies—this matches the connection-centric nature of room state.
- Continue exposing transport-level helpers (`send`, `broadcast`, `broadcastToRoom`) plus `userId` and `username`; domains remain free to ignore what they don’t need.
- If we later move `RoomManager` behind a store, we can still implement `HandlerContext.rooms` on top of that store, so existing domains remain unaffected.
- Domain handlers will map `HandlerContext` into their domain-specific action context (using the ws bridge for transport helpers) so the actions remain decoupled and callable from other orchestrators.

### Typing Strategy
- Extend `common/src/utils/message-helpers.ts` with backend-aware helpers: `MessageHandlerWithCtx<TUnion, TCtx>`, `HandlerMapWithCtx<TUnion, TCtx>`, and (optionally) `mergeHandlerMapsWithCtx` for future reuse. Frontend code continues to rely on the payload-only `HandlerMap`.
- `createWSServer` accepts `HandlerMapWithCtx<ClientMessage, HandlerContext>` and returns transport helpers the domains can reuse:
  ```ts
  export function createWSServer(config: {
    handlers: HandlerMapWithCtx<ClientMessage, HandlerContext>;
    roomAdapter: RoomMembershipAdapter;
  }): {
    handleConnection(socket: WebSocket, userId: string, username: string): void;
    broadcast(message: ServerMessage, excludeSelf?: boolean): void;
    broadcastToRoom(roomId: string, message: ServerMessage, excludeSelf?: boolean): Promise<void>;
    sendToUser(userId: string, message: ServerMessage): void;
    roomAdapter: RoomMembershipAdapter;
  };
  ```
- Domain handler modules export literals that satisfy `HandlerMapWithCtx<ChatClientMessage, HandlerContext>` and immediately map the transport context into their bridge-provided action context.
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
// backend/src/domains/chat/ws-bridge.ts
import type { ServerMessage } from '../../../common/src';

interface ChatWsApi {
  broadcastToRoom(
    roomId: string,
    message: ServerMessage,
    excludeSelf?: boolean
  ): void;
}

function createChatWsBridge() {
  let api: ChatWsApi | null = null;

  return {
    init(next: ChatWsApi) {
      api = next;
    },
    get(): ChatWsApi {
      if (!api) {
        throw new Error('Chat WS bridge not initialized');
      }
      return api;
    },
    reset() {
      api = null;
    },
  };
}

export const chatWs = createChatWsBridge();
export type { ChatWsApi };
```

```ts
// backend/src/domains/chat/actions.ts
import type { ChatSendPayload } from '../../../common/src';
import { ChatMessageBuilders } from './message-builders';
import { chatWs, type ChatWsApi } from './ws-bridge';
import { chatStore } from './store-singleton';

interface ChatActionContext {
  userId: string;
  username: string;
  ws: ChatWsApi;
}

export const chatActions = {
  sendMessage(payload: ChatSendPayload, ctx: ChatActionContext) {
    const message = {
      id: `msg-${Date.now()}`,
      roomId: payload.roomId,
      text: payload.text.trim(),
      userId: ctx.userId,
      username: ctx.username,
      timestamp: Date.now(),
    };

    chatStore.save(message);
    ctx.ws.broadcastToRoom(message.roomId, ChatMessageBuilders.message(message));
    return message;
  },
};

export type { ChatActionContext };
```

```ts
// backend/src/domains/chat/handlers.ts
import type { ChatClientMessage } from '../../../common/src';
import type { HandlerMapWithCtx } from '../../../common/src/utils/message-helpers';
import type { HandlerContext } from '../../ws/types';
import { chatWs } from './ws-bridge';
import { chatActions, type ChatActionContext } from './actions';

function toActionContext(ctx: HandlerContext): ChatActionContext {
  return {
    userId: ctx.userId,
    username: ctx.username,
    ws: chatWs.get(),
  };
}

export const chatHandlers = {
  'chat:send': (payload, ctx) => {
    chatActions.sendMessage(payload, toActionContext(ctx));
  },
  // ...other handlers
} satisfies HandlerMapWithCtx<ChatClientMessage, HandlerContext>;
```

```ts
// backend/src/server.ts (excerpt)
import { chatHandlers, chatWs } from './domains/chat';
import { systemHandlers, systemWs } from './domains/system';
import { timerHandlers, timerWs } from './domains/timer';

const handlers = {
  ...chatHandlers,
  ...systemHandlers,
  ...timerHandlers,
} satisfies HandlerMapWithCtx<ClientMessage, HandlerContext>;

const server = createWSServer({
  handlers,
  roomAdapter,
});

chatWs.init({
  broadcastToRoom: (roomId, message, excludeSelf) =>
    server.broadcastToRoom(roomId, message, excludeSelf),
});

systemWs.init({
  broadcastToRoom: (roomId, message, excludeSelf) =>
    server.broadcastToRoom(roomId, message, excludeSelf),
  roomAdapter: server.roomAdapter,
});

timerWs.init({
  broadcastToRoom: (roomId, message, excludeSelf) =>
    server.broadcastToRoom(roomId, message, excludeSelf),
});

const wss = new WebSocketServer({ port });
wss.on('connection', (socket) => server.handleConnection(socket));
```

## Tradeoffs & Constraints
- **Pros:** clearer separation of concerns, easier to test actions without spinning up WS server, better type safety, closer parity with frontend design.
- **Cons:** more files and explicit wiring; slightly higher upfront complexity for a small demo. Fake stores still risk accidental shared state across tests unless reset helpers are provided.
- **Neutral decisions:** keeping `RoomManager` under `ws` while injecting a thin adapter keeps transport concerns centralized without blocking future moves.

## Implementation Phases
1. **Type Helpers:** extend `common/src/utils/message-helpers.ts` with the backend `*WithCtx` helpers and prune `createHandlerMap`/`mergeHandlerMaps` once nothing references them.
2. **Scaffold Stores:** move `chat/service.ts` and `timer/service.ts` data into `db` modules, expose factory + `reset` helpers, and move typing store from `chat/fake-db.ts` into `db/chat-typing-store.ts` (or similar).
3. **Domain Modules:** in `domains/chat`, `domains/system`, and `domains/timer`, stand up store singletons, action sets, strongly-typed handler maps (using `HandlerMapWithCtx`), and `ws-bridge` modules with `init/get/reset`.
4. **Server Composition:** refactor `server.ts` to build the merged handler object with `satisfies HandlerMapWithCtx`, update `createWSServer` to return the transport helpers, and initialize each domain bridge with the pieces it needs (system also receives the room adapter).
5. **Cleanup & Verification:** remove old service classes, update imports, add any logging adjustments, and run smoke tests (start backend + frontend, send messages, start/pause timer). Consider a lightweight unit test per action module to exercise store reset paths.

## Open Questions
- Long term, do we want a global registry of actions for cross-domain coordination, or keep explicit imports per domain? (Decision for now: stay with explicit imports.)
- At what point should we trim `HandlerContext` if domains only use a subset of helpers? Worth revisiting once more domains and transports exist.
- What is the right hook for propagating disconnect-driven room leaves into the system domain? (TODO captured above; revisit after the initial refactor.)

## Next Steps
- Land the shared helper updates in `common/src/utils/message-helpers.ts` (add `*WithCtx`, remove unused helpers) so backend typing changes compile cleanly.
- Sketch the new `createWSServer` signature/return type alongside the domain bridge contracts before cutting code.
- Prototype the chat domain end-to-end with store factories + resets, then mirror the pattern in system and timer, tightening logs afterward.
