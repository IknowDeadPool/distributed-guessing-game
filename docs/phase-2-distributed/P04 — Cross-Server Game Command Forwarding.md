# P04 — Cross-Server Game Command Forwarding

## Problem

After implementing cross-server room discovery, joining, leaving, and event broadcasting, players could interact with rooms hosted on different server instances.

However, game operations such as starting a game and submitting guesses also needed to work across servers.

A player could be connected to Server B while participating in a room owned by Server A.

Since the authoritative Room and Game objects existed only on Server A, Server B could not directly execute game operations against them.

These requests needed to be forwarded to the server responsible for managing the room.

## Expected Behavior

Players should be able to start games and submit guesses regardless of which server they are connected to.

For example:

1. Player 1 creates a room through Server A.
2. Player 2 connects to Server B and joins the room.
3. Server A remains the owner of the room.
4. Player 2 submits a game command through Server B.
5. Server B identifies Server A as the room owner using Redis.
6. Server B forwards the command to Server A.
7. Server A executes the operation against its local Room and Game objects.
8. The result is returned to Server B.
9. The appropriate Socket.IO events are broadcast to all players in the room.

This behavior should work for both `game:start` and `game:guess`.

## Root Cause

Each server maintains independent in-memory Room and Game Maps.

Although the Socket.IO Redis Adapter allows broadcasts to reach clients connected to different servers, it does not synchronize or modify the authoritative game state.

If Server B attempted to execute a game operation locally, it would not find the room or game in its Maps when Server A owned them.

Therefore, game commands needed to follow the same ownership-based request forwarding mechanism used for room joining and leaving.

## Solution

I extended the existing server-to-server HTTP forwarding architecture to support game operations.

### 1. Ownership-Based Request Routing

Before executing a game operation, the server determines the owner of the room using:

`RoomOwnershipRegistry.getOwner(roomCode)`

There are two possible execution paths:

- If the current server owns the room, the operation is executed locally.
- If another server owns the room, the request is forwarded to the owner using HTTP.

This ensures that game operations are always executed against the authoritative Room and Game objects.

### 2. Game Start Forwarding

I implemented cross-server forwarding for the `game:start` operation.

When a player requests to start a game:

1. The Socket.IO handler receives the `game:start` event.
2. The request is passed to the application layer.
3. The coordinator identifies the room owner using Redis.
4. If the current server owns the room, the game starts locally.
5. Otherwise, the request is forwarded to the owning server.
6. The owning server executes the game-start operation.
7. The result is returned to the requesting server.

This allows a player connected to a non-owning server to start a game without requiring a local copy of the game state.

### 3. Game Guess Forwarding

I implemented the same ownership-based forwarding mechanism for the `game:guess` operation.

When a player submits a guess:

1. The Socket.IO handler receives the `game:guess` event.
2. The request is passed to the application layer.
3. The coordinator identifies the room owner using Redis.
4. If the current server owns the room, the guess is processed locally.
5. Otherwise, the request is forwarded to the owning server.
6. The owning server validates and processes the guess against its authoritative Game object.
7. The result is returned to the requesting server.

The existing game rules and validation logic remain on the owning server rather than being duplicated across server instances.

### 4. Socket.IO Event Broadcasting

After the owning server processes a game operation, the resulting events are distributed using the Socket.IO Redis Adapter.

This allows clients connected to different server instances to receive game-related updates.

The responsibilities remain separated:

- HTTP forwarding routes game commands to the owning server.
- The owning server modifies the authoritative game state.
- The Socket.IO Redis Adapter distributes the resulting events across server instances.

## Verification

I tested both game operations using independent Node.js server processes.

### Game Start Test

1. Started Server A on port `3001`.
2. Started Server B on port `3002`.
3. Created a room through one server.
4. Joined the room through the other server.
5. Triggered `game:start` through a server that did not own the room.
6. Verified that the owning server processed the operation.
7. Verified that the game-start operation worked across server instances.

### Game Guess Test

1. Used a room with players connected to different server instances.
2. Submitted a guess through a non-owning server.
3. Verified that the request reached the room-owning server.
4. Verified that the guess was processed against the authoritative Game object.
5. Verified that the game continued to work across server instances.

Both `game:start` and `game:guess` were tested with same-server and cross-server communication.

## Architectural Decision

I reused the ownership-based HTTP forwarding mechanism rather than introducing a separate communication mechanism for each game operation.

This keeps request routing consistent across room and game operations.

The room-owning server remains the single authority responsible for modifying the game state.

This also prevents multiple server instances from independently modifying copies of the same game.

## Limitations and Future Considerations

- Internal HTTP endpoints do not yet have production-grade server-to-server authentication.
- Request timeouts, retries, and idempotency need further consideration.
- Redis ownership TTL renewal and failure recovery are deferred.
- Redis Pub/Sub does not provide durable event storage or replay.
- Server failure during an active game requires additional recovery mechanisms.
- Further load testing is required to evaluate performance with multiple server instances.

## Status

Cross-server forwarding for `game:start` and `game:guess` has been implemented and tested.

Both operations work with same-server and cross-server communication.

The room-owning server remains responsible for all authoritative game-state modifications, while the Socket.IO Redis Adapter distributes resulting events across server instances.