<!-- # P03 — Cross-Server Room Leaving

## Problem

After implementing cross-server room joining, players could join rooms regardless of which server they were connected to.

However, a similar problem existed when a player attempted to leave a room.

A player connected to Server B could belong to a room owned by Server A. Since Server B did not maintain the room's authoritative state in its local memory, it could not directly remove the player from that room.

The leave request needed to reach the server responsible for managing the room.

## Expected Behavior

A player should be able to leave a room regardless of which server they are connected to.

For example:

1. Player 1 creates a room through Server A.
2. Player 2 connects to Server B and joins Player 1's room.
3. Server A remains the owner of the room.
4. Player 2 sends a leave request through Server B.
5. Server B identifies Server A as the room owner using Redis.
6. Server B forwards the leave request to Server A.
7. Server A removes Player 2 from its local Room and Game objects.
8. The updated room state is returned to Server B.

If the last player leaves, the room and its associated game should be deleted, and its ownership reservation should be released from Redis.

## Root Cause

Each server maintains independent in-memory Room and Game Maps.

When a room is created on Server A, its state exists only on Server A. A player connected to Server B can interact with that room through the cross-server joining mechanism, but Server B cannot directly modify the authoritative room state.

Calling the local `RoomManagement.leaveRoom()` method on Server B would fail because the room does not exist in its local memory.

Therefore, the leave request must be forwarded to the server that owns the room.

## Solution

I extended the existing cross-server request forwarding architecture to support room leaving.

### 1. Room Request Forwarder

I added a `forwardLeave()` method to `RoomRequestForwarder.js`.

This method:

1. Receives the owner server ID, room code, and player ID.
2. Retrieves the owner's address using `ServerDirectory`.
3. Sends an HTTP POST request to the owner's internal leave endpoint.
4. Checks the HTTP response status.
5. Parses and returns the response from the owner server.

### 2. Internal Room Leave Endpoint

I introduced an internal endpoint:

`POST /internal/rooms/:roomCode/leave`

The endpoint validates the incoming player information and delegates the leave operation to `MatchCoordinator`.

It returns the complete result of the leave operation, including whether the room was deleted and the updated room information when the room still exists.

Returning the complete result is important because the room may no longer exist after the leave operation.

### 3. Match Coordinator Changes

I updated `MatchCoordinator.leaveRoom()` to determine which server owns the room.

The flow is:

- Retrieve the room owner using `RoomOwnershipRegistry.getOwner()`.
- If the current server owns the room, remove the player from its local Room and Game objects.
- If another server owns the room, forward the leave request using `RoomRequestForwarder.forwardLeave()`.

The coordinator handles two possible outcomes.

**Room still exists:**

- The player is removed.
- The remaining room state is retrieved.
- The updated public match state is returned.

**Room becomes empty:**

- The room is deleted.
- The associated game is removed.
- The Redis ownership reservation is released.
- The result indicates that the room was deleted.

For forwarded requests, the coordinator returns the complete result from the owner server rather than attempting to retrieve room state from its own local Maps.

### 4. Socket.IO Room Cleanup

After a successful leave operation, the Socket.IO handler removes the player's socket from the corresponding Socket.IO room and clears the room-related information stored in `socket.data`.

This separates two responsibilities:

- `MatchCoordinator` manages the authoritative game and room state.
- Socket.IO manages the player's connection and room membership.

## Verification

I tested the implementation using two independent Node.js server processes.

### Test Scenario

1. Started Server A on port `3001`.
2. Started Server B on port `3002`.
3. Created a room through Server A.
4. Joined the room through Server B.
5. Sent a leave request through Server B.

### Expected Behavior

- Server B identifies Server A as the room owner.
- Server B forwards the leave request to Server A.
- Server A removes the player from its local Room and Game objects.
- Server A returns the updated room information.
- Server B receives the result without needing a local copy of the room.

A separate test should verify that when the last player leaves, the room, associated game, and Redis ownership entry are deleted.

## Architectural Decision

I reused the HTTP forwarding mechanism introduced for cross-server room joining rather than introducing a separate communication mechanism for leaving.

This keeps the server-to-server communication consistent and ensures that only the room-owning server modifies the authoritative Room and Game state.

I also kept the distinction between `playerId` and `socketId`:

- `playerId` identifies a player in the game domain.
- `socketId` identifies a particular Socket.IO connection.
- `roomCode` identifies the room.

The server-to-server leave request uses `roomCode` and `playerId`, because the operation modifies game state rather than targeting a specific socket connection.

## Limitations and Future Considerations

- Internal HTTP endpoints do not yet have production-grade server-to-server authentication.
- Request timeouts, retries, and idempotency need further consideration.
- Unexpected socket disconnections still need dedicated cleanup handling.
- Cross-server Socket.IO event broadcasting is a separate concern and requires the Socket.IO Redis Adapter.
- Reconnection grace periods and recovery of disconnected players are deferred.
- Server failure recovery and ownership reassignment are deferred to a later phase.

## Status

Cross-server room leave forwarding has been implemented in the application code.

Complete verification of normal room leaving, last-player deletion, Redis ownership release, and cross-server event delivery should be tracked separately.

Cross-server Socket.IO broadcasting and unexpected disconnect handling remain separate tasks. -->

















# P03 — Cross-Server Room Leaving and Event Broadcasting

## Problem

After implementing cross-server room joining, players could join rooms regardless of which server they were connected to.

However, room leaving introduced two related challenges.

First, a player connected to a server that did not own the room could not directly modify the authoritative Room and Game objects.

Second, even if the room-owning server successfully processed the leave request, the resulting Socket.IO event needed to reach players connected to other server instances.

Each server maintained its own in-memory Room and Game Maps and its own Socket.IO instance.

Therefore, I needed to implement both cross-server leave request forwarding and cross-server event broadcasting.

## Expected Behavior

A player should be able to leave a room regardless of which server they are connected to.

All remaining players should receive the updated room state, regardless of which server they are connected to.

For example:

1. Player 1 creates a room through Server A.
2. Player 2 connects to Server B and joins Player 1's room.
3. Server A remains the owner of the room.
4. Player 2 sends a leave request through Server B.
5. Server B identifies Server A as the room owner using Redis.
6. Server B forwards the leave request to Server A.
7. Server A removes Player 2 from its local Room and Game objects.
8. Server A broadcasts the updated room state.
9. All remaining players receive the update, including those connected to Server B.

If the last player leaves, the room and its associated game should be deleted, and its ownership reservation should be released from Redis.

## Root Cause

There were two separate limitations in the existing architecture.

### 1. Independent Room and Game State

Each server maintains independent in-memory Room and Game Maps.

Although Redis allows servers to discover room ownership, it does not provide direct access to another server's in-memory objects.

A server cannot directly modify a room owned by another server.

### 2. Independent Socket.IO Instances

Socket.IO maintains room membership independently within each server instance.

A broadcast using:

`io.to(roomCode).emit("match:stateUpdated", updatedRoom);`

would normally reach only sockets connected to that particular Socket.IO server.

Even if the room-owning server successfully processed a leave request, players connected to other servers would not automatically receive its broadcasts.

## Solution

I extended the distributed architecture in two areas: cross-server leave request forwarding and cross-server Socket.IO event broadcasting.

### 1. Socket.IO Redis Adapter

I integrated the `@socket.io/redis-adapter` package to enable communication between Socket.IO instances.

The adapter uses Redis Pub/Sub to distribute broadcasts between server instances.

Each server initializes Redis publisher and subscriber connections and attaches the adapter to its Socket.IO instance.

With the adapter configured, Socket.IO room broadcasts can reach matching sockets connected to different server instances.

I retained the existing room-based broadcasting approach:

`io.to(roomCode).emit("match:stateUpdated", updatedRoom);`

The adapter handles cross-server event distribution without requiring custom HTTP forwarding for every broadcast.

### 2. Room Request Forwarder

I added a `forwardLeave()` method to `RoomRequestForwarder.js`.

This method:

1. Receives the owner server ID, room code, and player ID.
2. Retrieves the owner's address using `ServerDirectory`.
3. Sends an HTTP POST request to the owner's internal leave endpoint.
4. Checks the HTTP response status.
5. Parses and returns the response from the owner server.

### 3. Internal Room Leave Endpoint

I introduced an internal endpoint:

`POST /internal/rooms/:roomCode/leave`

The endpoint validates the incoming player information and delegates the leave operation to `MatchCoordinator`.

It returns the complete result of the leave operation, including whether the room was deleted and the updated room information when the room still exists.

Returning the complete result is important because the room may no longer exist after the leave operation.

### 4. Match Coordinator Changes

I updated `MatchCoordinator.leaveRoom()` to determine which server owns the room.

The flow is:

- Retrieve the room owner using `RoomOwnershipRegistry.getOwner()`.
- If the current server owns the room, remove the player from its local Room and Game objects.
- If another server owns the room, forward the leave request using `RoomRequestForwarder.forwardLeave()`.

The coordinator handles two possible outcomes.

**Room still exists:**

- The player is removed.
- The updated public match state is retrieved.
- The result is returned to the requesting server.

**Room becomes empty:**

- The room is deleted.
- The associated game is removed.
- The Redis ownership reservation is released.
- The result indicates that the room was deleted.

For forwarded requests, the coordinator returns the complete result from the owner server rather than attempting to retrieve room state from its own local Maps.

### 5. Socket.IO Room Cleanup and Broadcasting

After a successful leave operation, the Socket.IO handler removes the player's socket from the corresponding Socket.IO room and clears the room-related information stored in `socket.data`.

The Socket.IO Redis Adapter allows broadcasts to reach players connected to different server instances.

This separates three responsibilities:

- `MatchCoordinator` manages authoritative room and game state.
- Socket.IO manages player connections and room membership.
- The Redis Adapter distributes broadcasts across server instances.

## Verification

I tested the distributed architecture using independent Node.js server processes connected to the same Redis instance.

### Cross-Server Broadcasting

1. Started Server A on port `3001`.
2. Started Server B on port `3002`.
3. Connected clients to both servers.
4. Placed the clients in the same Socket.IO room.
5. Emitted a Socket.IO event from one server.
6. Verified that clients connected to both servers received the event.

### Cross-Server Room Leaving

1. Created a room through Server A.
2. Joined the room through Server B.
3. Sent a leave request through Server B.
4. Verified that Server A processed the request as the room owner.
5. Verified that the player was removed from the authoritative Room and Game objects.
6. Verified that the remaining players could receive the updated room state across server instances.

The last-player-leaves scenario should also be tested separately to verify room deletion, game deletion, and Redis ownership release.

## Architectural Decision

I chose to use HTTP forwarding for room-leave operations and the Socket.IO Redis Adapter for event broadcasting.

These mechanisms solve different problems:

- HTTP forwarding ensures that room modifications are processed by the authoritative server.
- Redis Pub/Sub through the Socket.IO Adapter distributes resulting events to clients connected to other servers.

The adapter does not synchronize Room or Game objects, and the HTTP forwarding mechanism does not replace cross-server event broadcasting.

Keeping these responsibilities separate preserves a single authoritative owner for each room.

## Limitations and Future Considerations

- Internal HTTP endpoints do not yet have production-grade server-to-server authentication.
- Request timeouts, retries, and idempotency need further consideration.
- Redis Pub/Sub does not provide durable event storage or replay.
- Unexpected socket disconnections need dedicated cleanup handling.
- Reconnection grace periods and player recovery are deferred.
- Server failure recovery and ownership reassignment are deferred to a later phase.

## Status

The Socket.IO Redis Adapter has been integrated to support cross-server event broadcasting.

Cross-server room-leave forwarding has been implemented in the application code.

Normal room leaving, last-player deletion, and Redis ownership release should be marked as tested only after their respective verification scenarios have been completed.