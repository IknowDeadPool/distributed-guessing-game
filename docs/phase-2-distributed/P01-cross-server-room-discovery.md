# P01 — Cross-Server Room Discovery

## Current Architecture

Each Node.js server maintains its own `RoomManagement` instance with a process-local `Rooms` Map.

## Problem

Players connected to different backend instances cannot join the same room.

## Experiment

**Setup**
- Server A: `localhost:3001`
- Server B: `localhost:3002`

**Steps**
1. Create a room through Server A.
2. Join that room through Server A.
3. Attempt to join the same room through Server B.

**Observed Results**

| Operation | Result |
|---|---|
| Create room on Server A | Success |
| Join through Server A | Success |
| Join through Server B | Failed: `room code should be valid` |

## Root Cause

Server A and Server B run as separate Node.js processes, each with its own memory.

Server B's `RoomManagement` cannot access the room stored in Server A's `Rooms` Map.

## Questions

1. How can Server B discover rooms created on Server A?
2. Should all servers share game state or should one server own each room?
3. How should servers communicate with one another?
4. How do we prevent concurrent updates from producing inconsistent game results?

## Next Step

Investigate shared state and room ownership approaches.

<!-- ## Status

Problem reproduced and verified. Solution not yet implemented. -->



## Solution

I introduced a shared room ownership registry using Redis.

Instead of replicating the entire Room and Game state across all servers, each room is managed by the server that created it. Redis stores only the ownership information, allowing any server to discover which server is responsible for a room.

### Room Ownership Registry

The `RoomOwnershipRegistry` provides three operations:

- `reserveRoom(roomCode, serverId)` — Reserves a room code for a server using Redis `SET NX EX`.
- `getOwner(roomCode)` — Retrieves the server ID responsible for a room.
- `releaseRoom(roomCode, serverId)` — Releases ownership only if the requesting server is the current owner. This is enforced using a Redis Lua script.

### Redis Key Structure

Each room's ownership is stored using the following key format:

`room:<ROOMCODE>:owner`

For example:

- Key: `room:ABC123:owner`
- Value: `server-A`

Ownership reservations currently have a TTL of 300 seconds (5 minutes).

### Architecture Decision

I chose to keep Room and Game objects in the memory of their owning server rather than storing or replicating the complete objects in Redis.

This keeps the existing single-server game logic intact while introducing a shared mechanism for discovering room ownership.

### Result

Any server can now query Redis to determine which server owns a particular room, even when that room does not exist in its local memory.

This establishes the foundation for forwarding room-related requests between servers.