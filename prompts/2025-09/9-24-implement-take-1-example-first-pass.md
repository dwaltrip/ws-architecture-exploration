
### Background

We are implementing an exmaple realtime web app.

The goal is develop and refine a nice WS architecture with good typing, ergonomics and whatnot.

We have a rough draft WS architecture w/ example code in carefully sketched out in the following doc: dev-notes/2025-09/9-24-ws-architecture-take-1.md

The app structure:
    - frontend: currently this is a blank react-ts project using Vite
    - backend: currently just an empty dir, backend code goes here
    - common: currently just an empty dir, common types and other code shared between BE and FE goes here

### Next steps

I'd like to start by fully implementing a working version of the example given in the doc.

Before we begin, let's discuss a few tweaks / clarifications:
- Each domain should have it's own folder in our top level packages. For example, with "chat", it should be something like:
    - frontend/src/chat/...
    - backend/src/chat/...
    - common/src/chat/...
        - I think we want to define the message types here, for both directions, so we can easily see in one place

- Paylaod types / structures should be declared in common, with a separate file for each domain.
- Let's be explicit with each payload structure and not extend payloads from other message types or from other direction (client-server vs server-client)

If you see other similar changes we can make, list them and lets discuss.

Let's also start by focusing on just the common types.

No code yet, lets carefully plan this out.
