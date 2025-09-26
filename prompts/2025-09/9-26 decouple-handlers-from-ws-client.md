
## Background / goal

Currently, our frontend WsClient class has hard-coded knowledge of the specific message types in our app, through the use of the types `ClientMessage` and `ServerMessage`. Those types contain all of the info about the message types in our app. ClientMessage specifies client->server messages and ServerMessage specifies the other direction.

I don't like this... I think that the WsClient class should be de-coupled / generic, and more of an independent lib. When we instantiate the speicfic client instance, THEN it can become aware of the specific message types.
So i'm thinking the handlers will be PASSED IN to the client when we create it / set it up.

---

## More code details

#### Handlers for "chat" domain

Please look at frontend/sr/chat/handlers-2.ts the 2 rough sketches for alternatives ways of defining our ws message handlers.

Compared to the old handlers (hanlders.ts, without the "-2"), these do NOT depend on WsClient. 

#### WsCliet

We will also need to change the following in WsClient, for starters:

* how `socket.addEventListener('message', () => { /* ... */ })` works
* how we instiante / setup the `new WsClient` instance

Maybe something that feels like this could be nice:

```ts
// example.ts
function createExampleClient(url: string) {
  // ...

  const client = new WSClient({
    url,
    handlersByDomain: {
      chat: ChatHandlers,
      // someOtherDomain: SomeOtherDomainHandlers,
    },
    // more options?
    // options: { }
  });

  // ...
}
```

---

## Additional notes

* There is only one "domain": the "chat" domain. But the architecture should cleanly support many domains.
* Right now I'm focusing on frontend, but there may be similar refactors I want to make on the backend.

---

## Prompt

Can you carefully look over the old frontend chat handlers, my new handler sketches (handlers-2.ts), frontend client, createExampleClient in example.ts, and any other relevant code?

Help me iterate on a design that feels better.

IMPORTANT: The specifics syntax that I'm suggesting isn't super important. It's more about the core structrure, the dependencies between different parts of the system, and the aesthetics of how the pieces are defined and fit together.

This is a tricky high-level deisgn task with several sub-problems of varying complexity and importance, so we may need to work on small pieces of at it once.

Also, make sure to clearly articulate any assumptions behind different decisions / designs. We may add and drop some criteria, depending on how important each is, what we discover, and how each factor constrains the design / types.

Think hard about what I'm asking and let's discuss different possible approaches. Let's think broadly at first. Ok let's go :)
