This file is getting a bit big w/ lots of tricky if conditions, careful bookkeeping, and whatnot. I'm wondering about any simplifications / cleanups we can do.
 
Two small ideas / examples after skimming the code:

###### 1. Helper for `isConnected`

The first `if` check in `flushPendingMessages` feels like it could be using some "standardized" helper /getter for whether or not we are in an "active" state. It looks like `send` is also doing the same check, so we could use the same helper in both? does that look right to you

e.g. Maybe:

```ts
get isConnected() {
  return this.socket && this.socket.readyState === WebSocket.OPEN;
}
```

###### 2. Logic in `cleanupAfterClose` could be part of "setup" instead??

Maybe we could just ensure that everything is reset / properly set to the correct initial state when we are opening / re-opening a new connection?

Right now it's just doing:

```ts
private cleanupAfterClose() {
    this.pendingMessages = [];
    this.reconnectAttempts = 0;
}
```
Double check my logic is correct and doesn't miss anything -- don't flatter me!

Please also look at the entire file and think about how we can simplify things and reduce the amount of "tricky" code.

Then let's discuss. Please use code blocks for snippets, not inline code.
