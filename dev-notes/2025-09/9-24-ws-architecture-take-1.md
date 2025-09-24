Source: https://claude.ai/share/47a38d57-49ac-4dc4-9740-a0700449c5f9

# TypeScript WebSocket Message Typing Architecture

## Overview

This document outlines a type-safe approach for handling WebSocket messages in a TypeScript application with separate client and server codebases. The pattern evolved from our discussion about balancing type safety with code readability and maintainability.

### Design Goals

1. **Full type safety** - Every message payload should be properly typed on both send and receive
2. **Enforced completeness** - TypeScript should prevent us from shipping code that doesn't handle all message types
3. **Domain separation** - Related messages should be grouped together for better organization
4. **DRY principle** - Payload types should be defined once and reused
5. **Readability** - The code should be approachable for developers who aren't TypeScript experts
6. **Clear client/server boundaries** - It should be obvious which messages flow in which direction

### Key Decisions Made

- **Discriminated unions** for message types (using a `type` field)
- **Shared payload definitions** that both client and server import
- **Domain-based organization** once you have more than ~10 message types
- **Compile-time enforcement** that all message types have handlers
- **Simple factory functions** over complex builder patterns for better readability

## File Structure

```
shared/
  └── messages.ts       # Shared types between client and server
client/
  └── websocket.ts      # Client-side WebSocket wrapper
server/
  ├── handlers/
  │   ├── chat.ts      # Chat domain handlers
  │   └── room.ts      # Room domain handlers  
  └── server.ts         # Main server setup
```

## Implementation

### Shared Types (`shared/messages.ts`)

```typescript
/**
 * Shared payload definitions - single source of truth for data shapes.
 * These are the actual data structures that get sent over the wire.
 */
export interface Payloads {
  // Chat domain payloads
  ChatMessageContent: { 
    text: string 
    roomId: string 
  }
  ChatMessageFull: { 
    id: string
    text: string
    userId: string
    username: string
    roomId: string
    timestamp: number 
  }
  ChatTyping: { 
    roomId: string
    isTyping: boolean 
  }
  ChatEdit: {
    messageId: string
    newText: string
  }
  
  // Room domain payloads
  RoomJoinRequest: { 
    roomId: string 
  }
  RoomInfo: { 
    roomId: string
    name: string
    users: Array<{
      id: string
      username: string
      joinedAt: number
    }> 
  }
  RoomUserEvent: { 
    roomId: string
    userId: string
    username: string 
  }
  
  // System payloads
  Error: { 
    code: string
    message: string
    details?: unknown 
  }
  Success: {
    message: string
  }
}

/**
 * Messages sent from client to server.
 * Using template literal types (`chat:${string}`) helps with domain grouping.
 */
export type ClientMessage = 
  // Chat domain - messages related to chat functionality
  | { type: 'chat:send'; payload: Payloads['ChatMessageContent'] }
  | { type: 'chat:edit'; payload: Payloads['ChatEdit'] }
  | { type: 'chat:typing'; payload: Payloads['ChatTyping'] }
  
  // Room domain - messages related to room management
  | { type: 'room:join'; payload: Payloads['RoomJoinRequest'] }
  | { type: 'room:leave'; payload: Payloads['RoomJoinRequest'] }
  | { type: 'room:list'; payload: Record<string, never> } // Empty payload

/**
 * Messages sent from server to client.
 * Note how some payloads are reused (ChatTyping) but extended with additional fields.
 */
export type ServerMessage =
  // Chat domain responses
  | { type: 'chat:message'; payload: Payloads['ChatMessageFull'] }
  | { type: 'chat:edited'; payload: Payloads['ChatEdit'] & { editedBy: string } }
  | { type: 'chat:typing'; payload: Payloads['ChatTyping'] & { userId: string; username: string } }
  
  // Room domain responses
  | { type: 'room:joined'; payload: Payloads['RoomInfo'] }
  | { type: 'room:left'; payload: Payloads['Success'] }
  | { type: 'room:list'; payload: { rooms: Array<{ id: string; name: string; userCount: number }> } }
  | { type: 'room:user_joined'; payload: Payloads['RoomUserEvent'] }
  | { type: 'room:user_left'; payload: Payloads['RoomUserEvent'] }
  
  // System messages
  | { type: 'error'; payload: Payloads['Error'] }

// Type helpers for extracting domain-specific messages
export type ChatClientMessages = Extract<ClientMessage, { type: `chat:${string}` }>
export type RoomClientMessages = Extract<ClientMessage, { type: `room:${string}` }>
```

### Client Implementation (`client/websocket.ts`)

```typescript
import { ClientMessage, ServerMessage } from '../shared/messages'

/**
 * Type-safe message creators for the client.
 * These provide intellisense and prevent typos in message construction.
 */
export const Messages = {
  chat: {
    send: (text: string, roomId: string): Extract<ClientMessage, { type: 'chat:send' }> => 
      ({ type: 'chat:send', payload: { text, roomId } }),
    
    edit: (messageId: string, newText: string): Extract<ClientMessage, { type: 'chat:edit' }> =>
      ({ type: 'chat:edit', payload: { messageId, newText } }),
    
    typing: (roomId: string, isTyping: boolean): Extract<ClientMessage, { type: 'chat:typing' }> =>
      ({ type: 'chat:typing', payload: { roomId, isTyping } })
  },
  
  room: {
    join: (roomId: string): Extract<ClientMessage, { type: 'room:join' }> =>
      ({ type: 'room:join', payload: { roomId } }),
    
    leave: (roomId: string): Extract<ClientMessage, { type: 'room:leave' }> =>
      ({ type: 'room:leave', payload: { roomId } }),
    
    list: (): Extract<ClientMessage, { type: 'room:list' }> =>
      ({ type: 'room:list', payload: {} })
  }
}

/**
 * Client-side WebSocket wrapper with type-safe event handling.
 * Provides a clean API for sending messages and listening to server events.
 */
export class WSClient {
  private socket: WebSocket
  private handlers = new Map<string, Set<Function>>()
  private reconnectAttempts = 0
  
  constructor(
    private url: string,
    private options = { maxReconnectAttempts: 5 }
  ) {
    this.connect()
  }
  
  private connect() {
    this.socket = new WebSocket(this.url)
    
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage
        this.dispatch(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
    
    this.socket.onclose = () => {
      if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => this.connect(), 1000 * this.reconnectAttempts)
      }
    }
    
    this.socket.onopen = () => {
      this.reconnectAttempts = 0
    }
  }
  
  /**
   * Send a message to the server.
   * The message parameter is fully typed based on ClientMessage union.
   */
  send(message: ClientMessage) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      console.error('WebSocket is not connected')
    }
  }
  
  /**
   * Type-safe event listener registration.
   * The handler's payload parameter is automatically typed based on the message type.
   */
  on<T extends ServerMessage['type']>(
    type: T,
    handler: (payload: Extract<ServerMessage, { type: T }>['payload']) => void
  ) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
    
    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler)
    }
  }
  
  private dispatch(message: ServerMessage) {
    const handlers = this.handlers.get(message.type)
    handlers?.forEach(handler => handler(message.payload))
  }
}

// Usage example:
// const ws = new WSClient('ws://localhost:3000')
// ws.on('chat:message', (payload) => {
//   console.log(payload.text) // fully typed!
// })
// ws.send(Messages.chat.send('Hello', 'room-1'))
```

### Server - Chat Domain (`server/handlers/chat.ts`)

```typescript
import { ChatClientMessages, Payloads } from '../../shared/messages'
import { HandlerContext, DomainHandlers } from '../types'
import { ServerMessages } from '../messages'

/**
 * Chat domain handlers.
 * Each handler only needs to handle its specific payload type.
 * TypeScript ensures we implement all chat-related message types.
 */
export function createChatHandlers(
  chatService: ChatService
): DomainHandlers<ChatClientMessages> {
  return {
    'chat:send': async (payload, ctx) => {
      // Validate message
      if (payload.text.length > 1000) {
        ctx.sendError('MESSAGE_TOO_LONG', 'Messages must be under 1000 characters')
        return
      }
      
      // Check if user is in the room
      if (!await ctx.isInRoom(payload.roomId)) {
        ctx.sendError('NOT_IN_ROOM', 'You must join a room before sending messages')
        return
      }
      
      // Save and broadcast
      const messageId = await chatService.saveMessage(
        payload.text,
        payload.roomId,
        ctx.userId
      )
      
      ctx.broadcastToRoom(
        payload.roomId,
        ServerMessages.chat.message(
          messageId,
          payload.text,
          ctx.userId,
          ctx.username,
          payload.roomId
        )
      )
    },
    
    'chat:edit': async (payload, ctx) => {
      // Verify ownership
      const message = await chatService.getMessage(payload.messageId)
      if (!message) {
        ctx.sendError('MESSAGE_NOT_FOUND', 'Message not found')
        return
      }
      if (message.userId !== ctx.userId) {
        ctx.sendError('FORBIDDEN', 'You can only edit your own messages')
        return
      }
      
      // Update and broadcast
      await chatService.updateMessage(payload.messageId, payload.newText)
      
      ctx.broadcastToRoom(
        message.roomId,
        ServerMessages.chat.edited(
          payload.messageId,
          payload.newText,
          ctx.username
        )
      )
    },
    
    'chat:typing': async (payload, ctx) => {
      // Only broadcast to others in the room
      ctx.broadcastToRoom(
        payload.roomId,
        ServerMessages.chat.typing(
          payload.roomId,
          payload.isTyping,
          ctx.userId,
          ctx.username
        ),
        true // exclude sender
      )
    }
  }
}
```

### Server - Room Domain (`server/handlers/room.ts`)

```typescript
import { RoomClientMessages } from '../../shared/messages'
import { HandlerContext, DomainHandlers } from '../types'
import { ServerMessages } from '../messages'

/**
 * Room domain handlers.
 * Manages room joining, leaving, and listing.
 */
export function createRoomHandlers(
  roomService: RoomService
): DomainHandlers<RoomClientMessages> {
  return {
    'room:join': async (payload, ctx) => {
      // Check if room exists
      const room = await roomService.getRoom(payload.roomId)
      if (!room) {
        ctx.sendError('ROOM_NOT_FOUND', `Room ${payload.roomId} does not exist`)
        return
      }
      
      // Add user to room
      await roomService.addUserToRoom(payload.roomId, ctx.userId)
      const roomInfo = await roomService.getRoomInfo(payload.roomId)
      
      // Send room info to the user who joined
      ctx.send(ServerMessages.room.joined(
        roomInfo.id,
        roomInfo.name,
        roomInfo.users
      ))
      
      // Notify others in the room
      ctx.broadcastToRoom(
        payload.roomId,
        ServerMessages.room.userJoined(
          payload.roomId,
          ctx.userId,
          ctx.username
        ),
        true // exclude the user who just joined
      )
    },
    
    'room:leave': async (payload, ctx) => {
      await roomService.removeUserFromRoom(payload.roomId, ctx.userId)
      
      // Confirm to user
      ctx.send(ServerMessages.room.left('Successfully left the room'))
      
      // Notify others
      ctx.broadcastToRoom(
        payload.roomId,
        ServerMessages.room.userLeft(
          payload.roomId,
          ctx.userId,
          ctx.username
        )
      )
    },
    
    'room:list': async (payload, ctx) => {
      const rooms = await roomService.listRooms()
      
      ctx.send(ServerMessages.room.list(
        rooms.map(r => ({
          id: r.id,
          name: r.name,
          userCount: r.users.length
        }))
      ))
    }
  }
}
```

### Server Setup (`server/server.ts`)

```typescript
import { WebSocket } from 'ws'
import { ClientMessage, ServerMessage } from '../shared/messages'
import { createChatHandlers } from './handlers/chat'
import { createRoomHandlers } from './handlers/room'

/**
 * Handler context provides utilities that handlers can use.
 * This abstracts WebSocket operations and provides domain-specific helpers.
 */
export interface HandlerContext {
  userId: string
  username: string
  socket: WebSocket
  send: (message: ServerMessage) => void
  sendError: (code: string, message: string) => void
  broadcast: (message: ServerMessage, excludeSelf?: boolean) => void
  broadcastToRoom: (roomId: string, message: ServerMessage, excludeSelf?: boolean) => void
  isInRoom: (roomId: string) => Promise<boolean>
}

/**
 * Generic type for domain handlers.
 * Each domain must implement handlers for all its message types.
 */
export type DomainHandlers<T extends ClientMessage> = {
  [K in T['type']]: (
    payload: Extract<T, { type: K }>['payload'],
    ctx: HandlerContext
  ) => void | Promise<void>
}

/**
 * Type-safe server message creators.
 * Provides a clean API for creating properly typed server messages.
 */
export const ServerMessages = {
  chat: {
    message: (
      id: string, 
      text: string, 
      userId: string, 
      username: string, 
      roomId: string
    ): Extract<ServerMessage, { type: 'chat:message' }> =>
      ({ 
        type: 'chat:message', 
        payload: { id, text, userId, username, roomId, timestamp: Date.now() } 
      }),
    
    edited: (
      messageId: string,
      newText: string,
      editedBy: string  
    ): Extract<ServerMessage, { type: 'chat:edited' }> =>
      ({ 
        type: 'chat:edited',
        payload: { messageId, newText, editedBy }
      }),
    
    typing: (
      roomId: string,
      isTyping: boolean,
      userId: string,
      username: string
    ): Extract<ServerMessage, { type: 'chat:typing' }> =>
      ({ 
        type: 'chat:typing',
        payload: { roomId, isTyping, userId, username }
      })
  },
  
  room: {
    joined: (
      roomId: string,
      name: string,
      users: Array<{ id: string; username: string; joinedAt: number }>
    ): Extract<ServerMessage, { type: 'room:joined' }> =>
      ({ type: 'room:joined', payload: { roomId, name, users } }),
    
    left: (message: string): Extract<ServerMessage, { type: 'room:left' }> =>
      ({ type: 'room:left', payload: { message } }),
    
    list: (rooms: Array<{ id: string; name: string; userCount: number }>): Extract<ServerMessage, { type: 'room:list' }> =>
      ({ type: 'room:list', payload: { rooms } }),
    
    userJoined: (roomId: string, userId: string, username: string): Extract<ServerMessage, { type: 'room:user_joined' }> =>
      ({ type: 'room:user_joined', payload: { roomId, userId, username } }),
    
    userLeft: (roomId: string, userId: string, username: string): Extract<ServerMessage, { type: 'room:user_left' }> =>
      ({ type: 'room:user_left', payload: { roomId, userId, username } })
  },
  
  error: (code: string, message: string, details?: unknown): Extract<ServerMessage, { type: 'error' }> =>
    ({ type: 'error', payload: { code, message, details } })
}

/**
 * Main WebSocket server.
 * The factory function ensures all required domains are provided.
 */
export function createWSServer(
  // TypeScript enforces that ALL domains are provided
  domains: {
    chat: DomainHandlers<ChatClientMessages>
    room: DomainHandlers<RoomClientMessages>
  },
  services: {
    roomService: RoomService
  }
) {
  // Flatten all domain handlers into a single map
  const handlers = new Map<string, Function>()
  
  Object.values(domains).forEach(domainHandlers => {
    Object.entries(domainHandlers).forEach(([type, handler]) => {
      handlers.set(type, handler)
    })
  })
  
  // Track connected clients and room memberships
  const clients = new Map<string, WebSocket>()
  const userRooms = new Map<string, Set<string>>() // userId -> Set<roomId>
  
  return {
    /**
     * Handle a new WebSocket connection.
     * Sets up message handling and context for this connection.
     */
    handleConnection(socket: WebSocket, userId: string, username: string) {
      clients.set(userId, socket)
      userRooms.set(userId, new Set())
      
      // Create context for this connection
      const context: HandlerContext = {
        userId,
        username,
        socket,
        
        send: (message) => {
          socket.send(JSON.stringify(message))
        },
        
        sendError: (code, message) => {
          socket.send(JSON.stringify(
            ServerMessages.error(code, message)
          ))
        },
        
        broadcast: (message, excludeSelf) => {
          const data = JSON.stringify(message)
          for (const [uid, ws] of clients) {
            if (!excludeSelf || uid !== userId) {
              ws.send(data)
            }
          }
        },
        
        broadcastToRoom: async (roomId, message, excludeSelf) => {
          const roomUsers = await services.roomService.getRoomUsers(roomId)
          const data = JSON.stringify(message)
          
          for (const user of roomUsers) {
            if (!excludeSelf || user.id !== userId) {
              clients.get(user.id)?.send(data)
            }
          }
        },
        
        isInRoom: async (roomId) => {
          return userRooms.get(userId)?.has(roomId) ?? false
        }
      }
      
      // Handle incoming messages
      socket.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString()) as ClientMessage
          const handler = handlers.get(message.type)
          
          if (!handler) {
            context.sendError(
              'UNKNOWN_MESSAGE_TYPE',
              `Unknown message type: ${(message as any).type}`
            )
            return
          }
          
          await handler(message.payload, context)
        } catch (error) {
          console.error('Handler error:', error)
          context.sendError(
            'HANDLER_ERROR',
            error instanceof Error ? error.message : 'An error occurred'
          )
        }
      })
      
      // Handle disconnect
      socket.on('close', async () => {
        clients.delete(userId)
        
        // Notify rooms that user left
        const rooms = userRooms.get(userId)
        if (rooms) {
          for (const roomId of rooms) {
            await context.broadcastToRoom(
              roomId,
              ServerMessages.room.userLeft(roomId, userId, username),
              true
            )
          }
        }
        userRooms.delete(userId)
      })
    }
  }
}

// Initialize the server with all required domains
const server = createWSServer(
  {
    // TypeScript will error if any domain is missing
    chat: createChatHandlers(new ChatService()),
    room: createRoomHandlers(new RoomService())
  },
  {
    roomService: new RoomService()
  }
)

// Example: Integrate with ws library
const wss = new WebSocketServer({ port: 3000 })

wss.on('connection', async (socket, req) => {
  // Extract user info from auth token, session, etc.
  const { userId, username } = await authenticateUser(req)
  
  server.handleConnection(socket, userId, username)
})
```

## Usage Examples

### Client Usage

```typescript
import { WSClient, Messages } from './client/websocket'

const ws = new WSClient('ws://localhost:3000')

// Set up message handlers with full type safety
ws.on('chat:message', (payload) => {
  // TypeScript knows payload has: id, text, userId, username, roomId, timestamp
  addMessageToUI(payload.id, payload.text, payload.username)
})

ws.on('room:joined', (payload) => {
  // TypeScript knows payload has: roomId, name, users
  console.log(`Joined ${payload.name} with ${payload.users.length} users`)
  updateUserList(payload.users)
})

ws.on('error', (payload) => {
  // Handle errors
  showErrorNotification(payload.code, payload.message)
})

// Send messages using type-safe creators
ws.send(Messages.room.join('lobby'))
ws.send(Messages.chat.send('Hello everyone!', 'lobby'))

// TypeScript prevents invalid messages
// ws.send({ type: 'invalid', payload: {} }) // ❌ TypeScript error
// ws.send(Messages.chat.send('Hi')) // ❌ TypeScript error - missing roomId
```

### Adding a New Domain

To add a new domain (e.g., user profile management):

1. Add message types to `shared/messages.ts`:
```typescript
export type ClientMessage = 
  // ... existing messages
  | { type: 'user:profile_update'; payload: { name?: string; avatar?: string } }
  | { type: 'user:profile_get'; payload: { userId: string } }

export type UserClientMessages = Extract<ClientMessage, { type: `user:${string}` }>
```

2. Create domain handler:
```typescript
export function createUserHandlers(userService: UserService): DomainHandlers<UserClientMessages> {
  return {
    'user:profile_update': async (payload, ctx) => {
      // Implementation
    },
    'user:profile_get': async (payload, ctx) => {
      // Implementation
    }
  }
}
```

3. Add to server initialization:
```typescript
const server = createWSServer({
  chat: createChatHandlers(chatService),
  room: createRoomHandlers(roomService),
  user: createUserHandlers(userService) // ❌ TypeScript error until you update the type
})
```

## Tradeoffs and Considerations

### What This Approach Provides

- **Type safety** throughout the entire message flow
- **Compile-time guarantees** that all messages are handled
- **Clear separation** between domains and between client/server
- **Good IDE support** with autocomplete and type checking
- **Scalability** through domain-based organization

### Current Limitations

- **No built-in request/response correlation** - would need to add message IDs for RPC-style patterns
- **No middleware support** - could be added if needed for auth, logging, etc.
- **Manual domain registration** - must remember to add new domains to the server
- **No runtime validation** - trusting TypeScript types, might want to add zod for untrusted input

### Potential Enhancements

1. **Add correlation IDs** for request/response patterns
2. **Add middleware chain** for cross-cutting concerns
3. **Add runtime validation** with zod schemas derived from types
4. **Add reconnection logic** with message queueing
5. **Add rate limiting** per message type or domain
6. **Generate client SDK** from server handler definitions

### Alternative Approaches We Considered

- **Complex mapped types** - more DRY but harder to understand
- **Builder pattern** - more "safe" but added unnecessary complexity  
- **Class-based handlers** - more OOP but functions are simpler
- **Single handler map** - simpler but loses domain organization

## Conclusion

This pattern provides a solid foundation for type-safe WebSocket communication. It's strict enough to catch errors at compile time but flexible enough to evolve as requirements change. The domain separation keeps the codebase organized as it grows, and the type safety makes refactoring much safer.

The key insight is using TypeScript's structural typing to enforce completeness - by requiring an object with all message types as keys, we get compile-time guarantees without runtime overhead.
