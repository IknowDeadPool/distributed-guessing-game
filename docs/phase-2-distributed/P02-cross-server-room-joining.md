# P02 — Cross-Server Room Joining

## Problem

After implementing the Redis room ownership registry, servers could discover which server owned a particular room.

However, a player connected to Server B still could not join a room created on Server A.

The room existed in Server A's in-memory `Room` and `Game` Maps, but Server B had no local reference to those objects.

## Expected Behavior

A player should be able to join a room regardless of which server they are connected to.

For example:

1. Player 1 creates a room through Server A.
2. Server A reserves ownership of the room in Redis.
3. Player 2 connects to Server B and attempts to join that room.
4. Server B discovers that Server A owns the room.
5. Server B forwards the join request to Server A.
6. Server A adds Player 2 to its local Room and Game objects.
7. Server B receives the updated public room state.

The authoritative Room and Game objects should remain on Server A.

## Root Cause

Each server maintains independent in-memory state.

When Server A creates a room, it stores the Room and Game objects in its own Maps. Server B cannot directly access these objects because they belong to a different Node.js process.

Although Redis allows Server B to discover the room's owner, it does not provide access to the actual Room and Game objects.

Therefore, the join request needs to be forwarded to the server responsible for managing the room.

## Solution

I implemented an HTTP-based request forwarding mechanism to communicate between server instances.

### 1. Server Directory

I introduced `ServerDirectory.js` to maintain a mapping between server IDs and their corresponding addresses.

For local development, the addresses are configured manually:

- `server-A` → `http://localhost:3001`
- `server-B` → `http://localhost:3002`

The directory provides a `getAddress(serverId)` method to retrieve the address of a server.

### 2. Room Request Forwarder

I introduced `RoomRequestForwarder.js` to handle communication between servers.

The `forwardJoin()` method:

1. Receives the owner server ID, room code, player ID, and player name.
2. Resolves the owner's address using `ServerDirectory`.
3. Sends an HTTP POST request to the owner's internal join endpoint.
4. Parses the response and returns the updated room information.

### 3. Internal Room Join Endpoint

I introduced an internal endpoint:

`POST /internal/rooms/:roomCode/join`

This endpoint is responsible for processing forwarded join requests.

It validates the incoming player information, creates a `Player` object, and passes the request to `MatchCoordinator`.

The endpoint is intended for communication between server instances rather than direct client requests.

### 4. Match Coordinator Changes

I updated `MatchCoordinator.joinRoom()` to determine where the room is owned.

The flow is:

- First, retrieve the room owner using `RoomOwnershipRegistry.getOwner()`.
- If the current server owns the room, add the player to its local Room and Game objects.
- If another server owns the room, forward the join request using `RoomRequestForwarder.forwardJoin()`.

After a successful join, the coordinator returns the public match state.

This ensures that both local and forwarded join operations return a consistent response.

## Verification

I tested the implementation using two independent Node.js server processes.

### Test Scenario

1. Started Server A on port `3001`.
2. Started Server B on port `3002`.
3. Created a room through Server A.
4. Connected a second player to Server B.
5. Attempted to join the room through Server B.

### Observed Behavior

- Server B received the join request.
- Server B queried Redis and identified `server-A` as the room owner.
- Server B forwarded the request to Server A through HTTP.
- Server A received the internal join request.
- Server A added the player to its local Room and Game objects.
- Server A retained ownership of the room.
- Server B did not create a duplicate Room or Game object.

The logs confirmed that the room remained in Server A's local Maps while Server B successfully forwarded the join request.

## Architectural Decision

I chose HTTP for server-to-server request forwarding.

This allows each server to communicate with the room owner without exposing or replicating the owner's in-memory Room and Game objects.

The existing game logic also remains centralized on the server that owns the room.

## Limitations and Future Considerations

- Server addresses are currently hardcoded in `ServerDirectory`.
- Internal HTTP endpoints do not yet have production-grade server-to-server authentication.
- Request timeouts, retries, and idempotency need further consideration.
- Cross-server Socket.IO event broadcasting is not implemented yet. A successful join does not by itself guarantee that all clients connected to different servers receive the same broadcast events.
- Server failure recovery and ownership reassignment are deferred to a later phase.

## Status

Cross-server room joining has been implemented and manually tested using two independent server instances.

Cross-server event broadcasting remains a separate pending task.