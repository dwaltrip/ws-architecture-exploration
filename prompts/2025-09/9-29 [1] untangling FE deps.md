This repo is a demo app for exploring / refining my websocket architecture in my real app. 

I'm getting close... right now im working on trying to finish the frontend design.

I was maybe a bit overly ambitiouos perhaps, and tried to implement DI so we aren't relying on importing globals...

But now I'm getting pretty stuck on this, even if I try to undo the DI changes and just use singletons (directly or via lazy getters).

I think I have a circular dependency issue... 

UI -> Actions -> Ws Effects -> Ws Client -> Handlers -> Actions (oops)
(The arrows are pointing *towards* dependencies)

Here are some notes from my scratchpad while working on this. they are a bit scattered  / unorganized but I think they will be helpful.

---

###### Modules

* **UI Components**: `ChatContainer`
* **Actions**: `ChatActions`
* **WsEffects**: `ChatWsEffects
	* helpers for constructing + sending specific client websocket messages to server
* **Handlers**: `ChatHandlers
	* handlers for incoming messages from server
* **Store**: `ChatStore`
* **Websocket Client**: `WsClient`
###### High-level Descriptions

Chat Container is the UI
* Renders declaratively using local state from Chat Store (read only, no write)
	* local state + also fetching from API
* Modifies app state (both FE + BE) **strictly / only** by calling Chat Actions

Chat Actions
* Modify local FE state via Chat Store setters
	* I think Chat Actions should have exclusive ownership over modifying store state. e.g. all store state change should happen *through* an action
* Send websocket messages to server using any needed "ws effects" modules (chat, system, etc)
* Call API request helpers (need to implement Chat API??). If there are any.. not sure, perhaps everything happens through websocket messages

Chat Store
* "dumb" local state
* intentionally has no awareness of how the state is used
* defines the state structure / shape
* auto-syncs w/ React (via zustand magic) to update appropriate components when the store state changes (by Chat Actions)

Chat Handlers (for server websocket messages)
* passed into the instance of Ws Client

Chat Ws Effects
* Constructs + sends client messages to the server, using our WsClient instance
* Are called by Actions

Ws Client
* Generic client module for using websockets
* Becomes "domain aware" when we create the instance of the app, by receiving any handlers (for server messages).
* Also is aware on instantiation of Client + Server message types via the concrete types that are passed into the type generic params (see `create-client.ts`)

###### Dependency Chains

Chat Container uses Chat Actions
* *using a lazy getter*

Chat Actions needs to:
* Send websocket messages to server
	* *most likely via domain-specific `ws-effects` modules, so we aren't constructing raw messages using the ws client*
	* e.g. using Chat Ws Effects
* Make API calls to server
* Update Chat Store

Ws Effects (e.g. Chat, System) needs Ws Client
.....

---

Can you help me make sense of all of this? And chart a path towards a simple and clean setup? I'm leaning towards abandoning the DI stuff, as it makes the code more complex and I don't think I'll need it much in my main app. I don't write a lot of tests, and the tests I do write are usually for key lgoic or more of "end-to-end", which DI is less helpful for I think.

But maybe we can the DI version working in a simple way, I don't know.

MAIN GOAL: For now, let's get on the same page w/ the current state and discuss possible next steps.

Please ask any clarifying questions you need. If it's helpful, you run `npm run build` in `/frontend` to see the current TS issues. It's in a partially broken state right now as I tried to implement DI.
