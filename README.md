# ShardPlay — Phase 2: Distributed Backend

Phase 2 extends the original single-instance multiplayer game into a distributed backend that supports multiple independent server instances.

The objective is to allow players connected to different backend instances to participate in the same game while maintaining a single authoritative owner for each room.

**This repository contains the backend only. There is no frontend.** All manual testing can be performed using Postman and multiple Socket.IO connections.

## 1. What Changed in Phase 2?

In Phase 1, each server maintained its own rooms and game state in memory. This meant that a room created on one server could not be accessed by another server.

Phase 2 introduces Redis-backed room ownership and communication between server instances.

The distributed implementation supports:

- Cross-server room discovery.
- Cross-server room joining.
- Cross-server room leaving.
- Forwarding game commands to the owning server.
- Broadcasting Socket.IO events across server instances.

## 2. Architecture

```text
                   Postman Client A
                          |
                          v
                  +---------------+
                  |   Server A    |
                  |    :3001      |
                  +---------------+
                          |
                          |
                          v
                       Redis
                          ^
                          |
                          |
                  +---------------+
                  |   Server B    |
                  |    :3002      |
                  +---------------+
                          ^
                          |
                   Postman Client B
```

Both servers are independent Node.js processes.

### Components

| Component | Responsibility |
|---|---|
| Server A | Handles clients connected to instance A |
| Server B | Handles clients connected to instance B |
| Redis | Stores room ownership metadata |
| RoomOwnershipRegistry | Reserves, discovers, and releases room ownership |
| ServerDirectory | Maps server IDs to server URLs |
| RoomRequestForwarder | Forwards room operations to the owning server |
| Socket.IO Redis Adapter | Distributes Socket.IO broadcasts between instances |
| MatchCoordinator | Coordinates room and game operations |

### Important architectural decision: Authoritative state

Redis does not store the complete room or game state.

Each room has one authoritative owner server. That server maintains the room and game state in its own memory.

Other server instances forward operations to the owner instead of independently modifying the room or game state.

This avoids having multiple servers independently manage the same room.

## 3. Technology Stack

- Node.js
- Express
- Socket.IO
- Redis
- `redis` Node.js client
- `@socket.io/redis-adapter`
- HTTP-based inter-server communication
- Postman
- Docker

## 4. Prerequisites

Install:

- Node.js (supported LTS version)
- npm
- Git
- Docker Desktop
- Postman

## 5. Clone and Install

```bash
git clone https://github.com/IknowDeadPool/distributed-guessing-game.git

cd distributed-guessing-game

git switch phase/2-distributed

cd backend

npm install
```

## 6. Running the Distributed System

Phase 2 requires Redis and two independent backend instances.

### Step 1 — Start Redis

If you already created the Redis container:

```bash
docker start guessing-game-redis
```

If you are setting it up for the first time:

```bash
docker run -d --name guessing-game-redis -p 6379:6379 redis
```

Verify the connection:

```bash
docker exec guessing-game-redis redis-cli ping
```

Expected output:

```text
PONG
```

The default Redis connection URL is:

```text
redis://localhost:6379
```

The application also supports overriding this through the `REDIS_URL` environment variable.

### Step 2 — Start Server A

Open a terminal in the backend directory.

Windows PowerShell:

```powershell
$env:PORT="3001"
$env:SERVER_ID="server-A"
$env:REDIS_URL="redis://localhost:6379"

npm start
```

### Step 3 — Start Server B

Open a second terminal in the same backend directory.

Windows PowerShell:

```powershell
$env:PORT="3002"
$env:SERVER_ID="server-B"
$env:REDIS_URL="redis://localhost:6379"

npm start
```

### Running instances

| Component | Port | Identifier |
|---|---:|---|
| Server A | 3001 | `server-A` |
| Server B | 3002 | `server-B` |
| Redis | 6379 | — |

You now have two independent backend instances connected to the same Redis service.

**Important:** The server IDs and URLs must match the server directory configuration used by the application.

## 7. Testing with Postman

The distributed backend can be tested without a frontend.

Use separate Postman Socket.IO requests to simulate players connected to different server instances.

### Phase 2 test setup

| Postman connection | Server URL | Purpose |
|---|---|---|
| Client A | `http://localhost:3001` | Player connected to Server A |
| Client B | `http://localhost:3002` | Player connected to Server B |

Create two Socket.IO requests in Postman and connect both.

Keep both connections open throughout the test.

### Test 1 — Cross-server room discovery and joining

1. Connect Client A to Server A.
2. Create a room from Client A.
3. Record the generated room code.
4. Connect Client B to Server B.
5. Attempt to join the room from Client B using the room code.
6. Verify that Server B discovers the room owner through Redis.
7. Verify that the join operation is forwarded to Server A.
8. Verify that the player successfully joins the room.
9. Verify that the expected room update reaches both clients.

**Expected result:** A room created on Server A can be joined by a player connected to Server B.

### Test 2 — Cross-server room leaving

1. Continue using the room created in Test 1.
2. Have the player connected to Server B leave.
3. Verify that the leave operation reaches the authoritative server.
4. Verify that the room membership is updated.
5. Verify that the remaining players receive the expected room update.

Also test the last-player departure and room ownership cleanup.

**Expected result:** Room membership and ownership cleanup are handled by the authoritative server.

### Test 3 — Cross-server game command forwarding

1. Create a room on Server A.
2. Join it from Server B.
3. Start the game using the client connected to the non-owning server.
4. Submit guesses from clients connected to different servers.
5. Verify that the commands reach the authoritative server.
6. Verify that the resulting game updates are broadcast to the connected clients.

**Expected result:** Players connected to different server instances can participate in the same game.

### Test 4 — Cross-server event broadcasting

Verify that clients connected to different instances receive the relevant Socket.IO room broadcasts.

The Socket.IO Redis Adapter distributes broadcasts between server instances.

It does not replicate the authoritative game state or provide durable event replay.

## 8. Client Events and Internal Communication

There are two distinct communication paths.

### Client-to-server Socket.IO events

Clients communicate with their connected backend instance using Socket.IO.

Confirmed client event names in the current implementation include:

| Event | Direction | Purpose |
|---|---|---|
| `room:leave` | Client → Server | Requests to leave a room |
| `game:start` | Client → Server | Requests to start a game |
| `game:guess` | Client → Server | Submits a guess |

Use the corresponding Postman requests and payloads from the implementation when reproducing these operations.

The remaining room creation, room joining, and server-to-client event names and payload formats should be taken from the Socket.IO handlers and the project's Postman collection.

### Internal HTTP routes

These routes are used for communication between backend instances. They are not frontend endpoints.

| Method | Route | Purpose |
|---|---|---|
| POST | `/internal/rooms/:roomCode/join` | Forwards a room join operation to the owner |
| POST | `/internal/rooms/:roomCode/leave` | Forwards a room leave operation to the owner |

Internal game command forwarding is also implemented through the internal game routes.

These routes are part of the server-to-server communication layer.

## 9. Redis Room Ownership

Redis is used to coordinate room ownership between server instances.

The `RoomOwnershipRegistry` provides operations for:

- Reserving a room for a server.
- Discovering the owner of a room.
- Releasing ownership when a room is deleted.

Room reservations use Redis `SET NX EX` with a 300-second TTL.

Ownership release uses a Lua script to ensure that a server only releases a room if it is still the owner.

Room ownership renewal and complete failure recovery are future improvements.

## 10. Running Included Tests

From the backend directory:

```bash
npm run test:game
npm run test:room
npm run test:redis
```

The Redis test requires a reachable Redis instance.

The default `npm test` command is currently a placeholder.

These scripts are separate from the manual distributed scenarios performed using multiple Postman Socket.IO connections.

## 11. Known Limitations and Future Improvements

The current Phase 2 implementation is an exploration of distributed backend architecture, not a production-ready system.

Areas for future work include:

- Authentication of internal server-to-server requests.
- Request timeouts and retry policies.
- Idempotency for forwarded commands.
- Redis room ownership renewal.
- Server failure detection and room ownership recovery.
- Player disconnect and reconnect handling.
- More extensive automated integration tests.
- Load and concurrency testing.
- Frontend implementation.

## 12. Phase 2 Problem Tracker

The implementation is documented through individual problem reports.

| Problem | Description |
|---|---|
| P01 | Cross-server room discovery |
| P02 | Cross-server room joining |
| P03 | Cross-server room leaving and event broadcasting |
| P04 | Cross-server game command forwarding |

See the individual documentation for implementation details, design decisions, and verification:

- [Phase 2 Overview and Problem Tracker](README.md)
- [Phase 2 Requirements](00-requirements.md)
- [P01 — Cross-Server Room Discovery](P01-cross-server-room-discovery.md)
- [P02 — Cross-Server Room Joining](P02-cross-server-room-joining.md)
- [P03 — Cross-Server Room Leaving and Event Broadcasting](P03-cross-server-room-leaving-and-event-broadcasting.md)
- [P04 — Cross-Server Game Command Forwarding](P04%20%E2%80%94%20Cross-Server%20Game%20Command%20Forwarding.md)

---

**Phase 2 demonstrates how a single-instance multiplayer backend can evolve into a distributed system using Redis coordination, HTTP request forwarding, and cross-server real-time event broadcasting.**