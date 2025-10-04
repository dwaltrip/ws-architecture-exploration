# Domain Architecture and Handler Registration Strategy

**Date:** 2025-10-03
**Status:** Design Discussion - Ready for Planning

## Background

This project is a game with multiple complex feature domains (chat, inventory, combat, trading, guilds, etc.). We're using a WebSocket-based architecture where:

- Frontend has a singleton `WSClient` that manages the WebSocket connection
- Different game features are organized into domain folders for code clarity
- Each domain registers message handlers with the WS client
- Domains can depend on each other (e.g., Chat uses System's room management)

### The Problem

We encountered a typing issue where `registerHandlers()` required a complete `HandlerMap<TIncoming>` (handlers for ALL message types), but we wanted to register handlers separately by domain - each domain only providing handlers for its own message types.

### Context & Goals

**Primary Goals:**
- **Code legibility and simplicity** - Clear domain boundaries, easy to navigate
- **Type safety** - Prevent mistakes when adding/modifying handlers
- **Ease of feature development** - Simple pattern to follow when adding new domains

**Non-Goals (for now):**
- Code splitting / lazy loading (will register all domains at app startup)
- Performance optimization of bundle size

This is an SPA using React Router, but routes don't need separate domain initialization.

## Key Insights & Decisions

### 1. Domain Organization Strategy

**Decision:** Treat all game feature domains as peers (uniform structure), not as layers.

**Reasoning:**
- In a complex game, many domains will depend on each other
- Creating "special" vs "normal" domains adds conceptual overhead
- A flat peer structure is simpler to reason about and more flexible
- The `system` domain (room/presence management) is just another domain that happens to be widely used, not infrastructure

**Structure:**
```
frontend/src/
├── ws/              ← Infrastructure (WS client implementation)
├── domains/         ← All game feature domains (future refactor)
│   ├── system/      ← Room/presence domain
│   ├── chat/        ← Chat domain
│   ├── inventory/   ← Inventory domain
│   └── combat/      ← Combat domain
└── pages/           ← UI layer
```

**Implications:**
- All domains follow the same pattern (handlers, actions, ws-effects, stores)
- No special initialization order required
- Cross-domain dependencies are allowed (as long as no circular deps)
- Easy to move existing domains into `src/domains/` folder later

### 2. Handler Registration Approach

**Decision:** Merge all domain handlers and register them together at app initialization.

**Reasoning:**
- We don't need lazy loading, so registering everything upfront is simplest
- Avoids needing to change `WSClient` types to accept partial handler maps
- Single registration point makes initialization sequence clear
- Already have `mergeHandlerMaps()` utility in codebase for this purpose

**Implementation Pattern:**
```typescript
// app-init.ts
export function initApp() {
  getWsClient().registerHandlers(
    mergeHandlerMaps(
      systemHandlers,
      chatHandlers,
      inventoryHandlers,
      // ... all domains
    )
  );

  connectWsClient();
}
```

**Benefits:**
- ✅ No type changes needed to `WSClient`
- ✅ Clear single source of truth for what's initialized
- ✅ Still breaks circular dependencies (deferred execution via `init()` call)
- ✅ Simple to add new domains (just add to merge list)

### 3. Circular Dependency Management

**Decision:** Keep the `init.ts` pattern to break circular dependencies at module load time.

**Current Circular Dependency Chain:**
```
chat/handlers → chat/actions → system/ws-effects → ws/create-client
```

**Why This Works:**
- `ws/create-client` creates WSClient singleton WITHOUT handlers
- All modules can import and complete loading
- `app-init.ts` calls registration at runtime (after all modules loaded)
- No circular dependency because handlers aren't passed at construction time

**Pattern to maintain:**
- Each domain can have handlers that reference domain actions/effects
- Domain actions/effects can import `getWsClient()` and other domains
- Registration is deferred until `initApp()` is called

### 4. Connection Lifecycle Ownership

**Decision:** App-level code owns the connection lifecycle, not any specific domain.

**Reasoning:**
- Keeps all domains truly uniform (no domain is "special")
- Clear and explicit initialization sequence
- Simple to reason about

**Implementation:**
```typescript
// App.tsx
function App() {
  useEffect(() => {
    initApp();  // Registers handlers + connects
  }, []);

  return <Router>...</Router>;
}
```

**Note:** The `ChatProvider` pattern can be removed - it was solving lazy loading, which we don't need.

### 5. Backend vs Frontend Architecture Asymmetry

**Insight:** Backend and frontend can (and should) have different architectural patterns.

**Backend:**
- Layered architecture makes sense
- `system` domain extends WS infrastructure with `broadcastToRoom()` primitive
- Other domains use System's room broadcasting capabilities
- System IS special on backend (infrastructure extension)

**Frontend:**
- Flat domain structure makes sense
- All domains are just consumers of the WS client
- System is just another domain (room/presence features)
- System is NOT special on frontend

**Takeaway:** Don't force architectural symmetry between frontend and backend when it doesn't serve the code's clarity.

## Possible Implementations / Refactorings

### Phase 1: Consolidate Handler Registration (Immediate)

**Goal:** Move to merged handler registration pattern

**Changes:**
1. Create `app-init.ts` with `initApp()` function
2. Import all domain handler objects (`systemHandlers`, `chatHandlers`, etc.)
3. Use `mergeHandlerMaps()` to combine them
4. Call `getWsClient().registerHandlers(merged)`
5. Call `connectWsClient()`
6. Update `App.tsx` to call `initApp()` in `useEffect`
7. Remove `ChatProvider` and `chat/init.ts` (no longer needed)

**Benefits:**
- Simpler initialization flow
- Single source of truth for registered domains
- Removes provider ceremony

### Phase 2: Organize Domains Folder (Optional)

**Goal:** Make domain organization more explicit in file structure

**Changes:**
1. Create `src/domains/` directory
2. Move existing domains: `chat/`, `system/`, and any others into `domains/`
3. Update imports throughout codebase
4. Keep `ws/` at `src/ws/` (it's infrastructure, not a domain)

**Benefits:**
- Clearer separation between domains and infrastructure
- Easier to navigate codebase
- Reinforces "domains as peers" mental model

### Phase 3: Type Safety Improvements (Future)

**Goal:** Improve type safety for handler registration (if needed later)

**Potential Approach:**
If we want compile-time validation that all message types have handlers, we could:
1. Add generic constraint to `registerHandlers`: `registerHandlers<T extends TIncoming>(handlerMap: HandlerMap<T>)`
2. Change internal storage to `Partial<HandlerMap<TIncoming>>`
3. Add optional validation method to check completeness at runtime

**Note:** This might not be necessary if the merge approach works well. Revisit if we encounter issues.

### Phase 4: Cleanup Domain Init Pattern (Future)

**Goal:** Establish consistent pattern for domain initialization if needed

**Current State:**
- Some domains might have `init.ts` files from old pattern
- Not all domains may need explicit init functions

**Possible Changes:**
- Remove domain-level `init.ts` files if they're only registering handlers
- Keep `init.ts` only if domain needs other initialization (stores, services, etc.)
- Document when to use `init.ts` vs just exporting handlers

## Open Questions & Ambiguities

### 1. Handler Cleanup / Unregistration

**Question:** Should we support unregistering handlers when features are torn down?

**Context:**
- Current TODO in `ChatProvider` mentions cleanup
- With merge approach, all handlers registered at app start
- No current use case for unregistration

**Considerations:**
- Handlers staying registered when not in use is probably fine (negligible overhead)
- If messages arrive for inactive features, handlers just update stores
- Only matters if we have hundreds of domains or memory constraints
- Would need to add `unregisterHandlers()` method to WSClient

**Decision needed:** Is handler cleanup a real requirement, or can we skip it?

### 2. Domain Initialization Order

**Question:** Does the order of handler registration matter?

**Context:**
- Currently using object spread in `mergeHandlerMaps()`
- Each domain should have unique message types (no overlap)
- But what if there's accidental overlap?

**Considerations:**
- TypeScript prevents overlap within a domain's handler map
- But doesn't prevent two domains from defining handlers for same type
- Runtime error currently logged (client.ts:97)
- Merge order would determine which handler "wins"

**Decision needed:**
- Is the runtime error sufficient?
- Should we add compile-time check for handler uniqueness across domains?
- Or document that each domain owns specific message type prefixes (e.g., `chat:*`, `system:*`)?

### 3. Cross-Domain Dependencies

**Question:** What guidelines should we have for domains depending on each other?

**Context:**
- Chat imports `systemWsEffects` to call `joinRoom()`
- This cross-domain import is fine (no circular dep)
- But could get messy with many domains

**Considerations:**
- Should we limit cross-domain imports to specific patterns?
- Should we create a "shared" domain for common utilities?
- Or keep it flexible and address issues as they arise?

**Decision needed:** Document best practices for cross-domain dependencies, or keep it ad-hoc?

### 4. WebSocket Reconnection & Handler Re-registration

**Question:** What happens to handlers when WebSocket reconnects?

**Context:**
- WSClient has reconnection logic (client.ts:149-178)
- Handlers are stored in `this.handlers` on the client instance
- Reconnection creates new WebSocket, but keeps same WSClient instance

**Current behavior:** Handlers persist across reconnections (this is good!)

**Considerations:**
- Is this behavior obvious/documented?
- Any edge cases where handlers might need re-registration?
- Should reconnection trigger any domain-level logic?

**Decision needed:** Document reconnection behavior, or is current implementation sufficient?

### 5. Type Safety for Message Handlers

**Question:** Should we enforce that ALL message types have registered handlers?

**Context:**
- Current approach: runtime error if message arrives with no handler (client.ts:207)
- No compile-time guarantee that all types are covered
- With multiple domains, easy to forget to register a domain's handlers

**Considerations:**
- Compile-time validation would require different type approach
- Could add runtime "seal" method that validates completeness
- Trade-off between flexibility and safety

**Decision needed:** Is runtime validation enough, or do we want stronger guarantees?

## Next Steps

1. Review this document and discuss any concerns/questions
2. Decide on approach for open questions
3. Create detailed implementation plan for Phase 1 (handler registration consolidation)
4. Consider whether Phase 2 (domains folder) should be combined with Phase 1
5. Implement and test changes
6. Document the final pattern for future domain development

---

## Appendix: Current Architecture Overview

### Frontend Domain Structure (Current)

Each domain follows this pattern:

```
domain/
├── handlers.ts      ← WebSocket message handlers (incoming messages)
├── actions.ts       ← Domain API / business logic
├── ws-effects.ts    ← WebSocket effects (outgoing messages)
├── store.ts         ← State management (if needed)
└── init.ts          ← Initialization (may be deprecated)
```

### Current Handler Registration Flow

1. `ws/create-client.ts` - Creates WSClient singleton (no handlers)
2. Domain handler files define handler objects (e.g., `chatHandlers`)
3. `ChatProvider` component calls `initChatDomain()` on mount
4. `initChatDomain()` calls `registerChatHandlers()` which calls `client.registerHandlers()`
5. `initChatDomain()` calls `connectWsClient()`

### Proposed Handler Registration Flow

1. `ws/create-client.ts` - Creates WSClient singleton (no handlers)
2. Domain handler files define and export handler objects
3. `App.tsx` calls `initApp()` in `useEffect`
4. `initApp()` merges all handler objects and registers once
5. `initApp()` calls `connectWsClient()`
