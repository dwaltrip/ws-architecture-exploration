# Repository Guidelines

## Overview
This repository hosts a demo application for experimenting with cross-stack WebSocket architecture. The backend showcases typed message routing, the frontend exercises those channels through React UX flows, and the `common` package keeps transport contracts aligned so both sides evolve safely. Treat every change as an opportunity to stress-test the messaging patterns.

We are focusing PRIMARILY on clean, smooth architecture that hides complexity and makes it as easy possible to add new message types with good typing and whatnot. And to make it easy to build new features and create a cool applciation :)

## Project Structure & Module Organization
TypeScript code is split across `backend`, `frontend`, and `common`. The backend WebSocket server lives in `backend/src`, organized by domain (`domains/chat`, `domains/system`, `domains/timer`) plus transport helpers under `ws/`. The React client resides in `frontend/src` with feature folders (`chat`, `timer`, `system`) and shared utilities under `utils/`. Shared message contracts and helpers stay in `common/src` so both runtime targets compile against the same types. Supporting notes and prompt experiments are kept in `dev-notes/` and `prompts/`—leave them untouched unless collaborating on docs.

## Build, Test, and Development Commands
Run everything from the relevant package directory after `npm install`. Backend: `npm run dev` starts the TypeScript server with hot reload via `tsx`, while `npm run build` emits compiled JS into `dist/`. Frontend: `npm run dev` launches Vite on port 5173, `npm run build` produces a production bundle, and `npm run lint` checks React code against the shared ESLint rules. Use two terminals when running full stack: backend on port 3000, frontend proxying WebSocket calls to it.

## Coding Style & Naming Conventions
Follow TypeScript strictness and keep two-space indentation (see `frontend/src/App.tsx` and `backend/src/server.ts`). Favor named exports from feature modules and keep filenames in `kebab-case` (`timer-store.ts`). React components use PascalCase, Zustand stores and helper utilities use camelCase. Avoid ad-hoc console logging; wrap structured logs in domain helpers when needed.

## Testing Guidelines
Automated tests are not yet scaffolded. When adding one, colocate `*.spec.ts` or `*.test.ts` beside the module and wire it into the chosen runner (Vitest is preferred for consistency with Vite). Until harnesses land, rely on TypeScript checks plus manual validation: run the backend dev server, interact through the frontend, and ensure cross-domain messages serialize via `common` types without casting.

## Commit & Pull Request Guidelines
Commits follow a short, imperative subject (`Fix timers`, `Tighten backend WS server typing`) with ≤72 characters and no trailing period. Use focused commits per feature or bug. PRs need a concise summary, linked issue (if applicable), and any screenshots or console transcripts that demonstrate front-end changes. Call out schema or protocol updates touching `common/src`; reviewers need to recompile both targets when these change.
