# WebSocket Handler Registration Bootstrap Plan

**Date:** 2025-10-03
**Status:** Draft for Review

## Background

Earlier we explored consolidating all domain handlers into a single merged map and registering them in one shot during app init (see the now-abandoned "Domain Architecture and Handler Registration" note). That proposal would have required flattening all handlers together and gave the WS client a fully-typed `HandlerMap`. In practice it introduced several problems:

- Type friction: domains only know about their own message types, so forcing them to build a total `HandlerMap<AppIncomingMessage>` meant we either had to widen types unsafely or rework the helper generics.  
- Centralization concerns: the merge step became a bottleneck—missing a domain from the merge silently dropped its handlers, and duplicate detection no longer ran.  
- Lifecycle confusion: per-domain `init` functions were still calling `connectWsClient()`, so the real ownership of the connection remained murky and React Strict Mode exposed double-connect behaviour.  

The team decided to keep domains modular, drop the compile-time sealing requirement, and instead rely on a runtime validator to ensure coverage before the socket connects. This document replaces the previous plan.

## Context

- Each domain (chat, system, etc.) currently registers its WebSocket handlers independently and some domains (system) never register at all.  
- `WSClient.registerHandlers` requires a complete `HandlerMap<AppIncomingMessage>`, so per-domain registration relies on unsafe assumptions or guards.  
- `ChatProvider` triggers both handler registration and `connectWsClient()`. With React Strict Mode the effect fires twice, resulting in duplicate `connect()` calls even though registration is idempotent.  
- We want to keep domains modular while ensuring **every incoming message type has a handler before the socket connects**.

## Decisions

- **Domains stay modular.** Each domain exports an idempotent `register*Handlers()` that only registers handlers; connection orchestration is owned elsewhere.  
- **WS client accepts partial maps.** Adjust `WSClient.registerHandlers` to take a `DomainHandlerMap<TIncoming>` (= `Partial<HandlerMap<TIncoming>>`). Internally the client still stores a single map keyed by message type. Duplicate keys continue to log an error.  
- **App-level bootstrap owns lifecycle.** A new `initializeWsApp()` helper (in `frontend/src/ws/bootstrap.ts`) registers all domain handlers, runs validation, and connects the socket once. `App.tsx` calls this inside a `useEffect` guarded against Strict Mode replays.  
- **Runtime coverage check.** After all domains register, we verify that every message type listed in `chatServerMessageTypes`, `systemServerMessageTypes`, etc., has a handler. Missing or duplicate registrations fail fast in development.  
- **No compile-time sealing (for now).** Runtime validation provides enough safety without adding meta-programming or code generation.

## Proposed Architecture

```
frontend/src/
├── ws/
│   ├── bootstrap.ts          ← exports initializeWsApp()
│   ├── client.ts             ← WSClient accepts DomainHandlerMap
│   └── create-client.ts
├── chat/
│   └── handlers.ts           ← exports registerChatHandlers()
├── system/
│   └── handlers.ts           ← exports registerSystemHandlers()
└── App.tsx                   ← useEffect(() => initializeWsApp(), [])
```

## Detailed Implementation Steps

1. **Define domain-friendly handler type**  
   - In `common/src/utils/message-helpers.ts`, export `type DomainHandlerMap<TUnion> = Partial<HandlerMap<TUnion>>;`.  
   - Optionally provide a helper `createDomainHandlerMap()` that simply returns its input; keeps domains self-documenting.

2. **Update `WSClient`** (`frontend/src/ws/client.ts`)
   - Change constructor param and `registerHandlers` signature from `HandlerMap<TIncoming>` to `DomainHandlerMap<TIncoming>`.
   - When the first map arrives, shallow-clone it into `this.handlers` (still a `HandlerMap<TIncoming> | null`).
   - For subsequent calls, iterate keys and warn on duplicates exactly as today. No change needed to `dispatch` or reconnection logic.
   - Ensure `registerHandlers` gracefully handles `handlers` being `null` or empty.
   - Add a method to expose registered handlers for validation (e.g., `getHandler(type: string)` or `hasHandler(type: string)`) so the coverage validator can introspect the registered handlers.

3. **Add bootstrap module** (`frontend/src/ws/bootstrap.ts`)  
   - Keep a module-level `initialized` boolean so Strict Mode double-invocation exits early.  
   - `initializeWsApp()` flow:
     1. If already initialized, return the existing client reference.  
     2. Call each domain’s registration function (`registerSystemHandlers()`, `registerChatHandlers()`, …).  
     3. Run `validateHandlerCoverage()` (see step 4).  
     4. Call `connectWsClient()` once and return the client.  
   - Export a `resetWsInitializationForTests()` if we need test hooks later.

4. **Implement runtime coverage validator** (`frontend/src/ws/validate-handlers.ts` or colocated in bootstrap)  
   - Import message-type constants: `chatServerMessageTypes`, `systemServerMessageTypes`, etc.  
   - Collect the expected set with domain metadata for error messages.  
   - Inspect `getWsClient().getHandler(type)` (or expose a helper on the client) to confirm every expected type resolves to a handler.  
   - Surface issues with descriptive errors (missing handler, handler belongs to unexpected domain, duplicate registration).  
   - Only throw in non-production builds (`if (import.meta.env.DEV) throw …`); in production log once and continue.

5. **Update domain entry points**  
   - Remove socket connection from `frontend/src/chat/init.ts`; either delete the file or leave it as a thin `register` re-export.  
   - Ensure `registerChatHandlers` and `registerSystemHandlers` remain idempotent. (The existing boolean flags already cover this.)  
   - Document expectation that **no domain calls `connectWsClient()` directly**.

6. **Wire bootstrap into `App.tsx`**  
   - Replace the `ChatProvider` usage with a `useEffect` that calls `initializeWsApp()` on mount.  
   - Optional: keep `ChatProvider` if it carries additional responsibilities; otherwise remove it to simplify composition.  
   - Confirm no other code path (e.g., `useWsClient`) triggers an extra `connect()` or `disconnect()`.

7. **Clean up supporting utilities**  
   - Ensure the runtime validator is invoked exactly once and fails fast before initial messages arrive.  
   - Add tests for `validateHandlerCoverage` if feasible (unit test with fake handler maps).  
   - Update developer docs to explain the new bootstrap pattern and runtime guard.

## Potential Issues / Mitigations

- **Strict Mode double-invocation**: handled by bootstrap’s `initialized` guard.  
- **New domains**: they must expose both `registerDomainHandlers()` and a message-type list (or reuse constants from `common`). Pairing these requirements in `bootstrap.ts` keeps the wiring obvious.  
- **Validator maintenance**: if backend adds a new message type but frontend can safely ignore it, we may need to mark certain types as optional. Document this and treat exceptions explicitly.  
- **`useWsClient` hook**: currently connects/disconnects on mount/unmount. Re-evaluate whether it’s still needed once bootstrap owns the lifecycle; either integrate it with the new flow or remove to avoid conflicting behavior.  
- **Production failures**: we throw only in dev, but still log in prod. Consider surfacing a UI warning if missing handlers would break critical gameplay.

## Open Questions

1. Should `validateHandlerCoverage` live in `ws/` or a shared `diagnostics/` module?  
2. Do we still need `ChatProvider` for non-WS responsibilities (state hydration, feature flags)?  
3. How should tests simulate the bootstrap (e.g., mock `connectWsClient`)?

---

Next action: review this plan, resolve open questions, then schedule the implementation tasks.
