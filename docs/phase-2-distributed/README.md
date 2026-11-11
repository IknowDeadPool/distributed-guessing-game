# Phase 2 — Distributed Multiplayer Guessing Game

## Objective

Extend the Phase 1 single-instance multiplayer guessing game to support multiple Node.js server instances while maintaining consistent room ownership, game state, scoring, and real-time communication.

Phase 2 introduces Redis-backed room ownership, server-to-server HTTP communication, and cross-server Socket.IO event broadcasting.

## Starting Point

Phase 1 uses Node.js, Express, and Socket.IO.

Room and game state are stored in process-local memory using JavaScript Maps.

Each server instance manages its own connections and game state.

**Phase 1 reference branch:** `phase/1-single-instance`

## Learning Approach

Each problem follows this workflow:

1. Identify a limitation in the current architecture.
2. Reproduce it with a scenario or experiment.
3. Investigate possible solutions.
4. Compare trade-offs and choose an approach.
5. Document the decision.
6. Implement and test the solution.
7. Identify the next limitation.

## Requirements

See [Phase 2 Requirements](./00-requirements.md).

## Problem Tracker

| ID | Problem | Status | Documentation |
|---|---|---|---|
| P01 | Cross-server room discovery | Implemented and tested | [P01 — Room Discovery](./P01-cross-server-room-discovery.md) |
| P02 | Cross-server room joining | Implemented and tested | [P02 — Room Joining](./P02-cross-server-room-joining.md) |
| P03 | Cross-server room leaving and event broadcasting | Implemented; verification of all cleanup scenarios pending | [P03 — Room Leaving and Event Broadcasting](./P03-cross-server-room-leaving-and-event-broadcasting.md) |
| P04 | Cross-server game command forwarding | Implemented and tested | [P04 — Game Command Forwarding](./P04%20%E2%80%94%20Cross-Server%20Game%20Command%20Forwarding.md) |

## Current Architecture

Phase 2 uses the following components:

### Redis — Room Ownership

Redis stores room ownership information.

Each room is associated with the server responsible for managing its authoritative Room and Game state.

Key structure:

`room:<ROOMCODE>:owner`

### Server-to-Server Communication — HTTP

Servers use HTTP requests to forward operations to the server that owns a room.

The forwarding mechanism is used for:

- Joining rooms.
- Leaving rooms.
- Starting games.
- Submitting guesses.

### Cross-Server Event Broadcasting — Socket.IO Redis Adapter

The Socket.IO Redis Adapter uses Redis Pub/Sub to distribute Socket.IO room broadcasts across server instances.

This allows clients connected to different servers to receive events from the same game room.

### Authoritative State Management

Room and Game objects remain in the memory of their owning server.

Redis stores ownership metadata rather than replicating the complete game state.

The owning server executes authoritative room and game operations.

## Architecture Decisions

The current architecture follows three main decisions:

1. Keep Room and Game state on the owning server rather than replicating complete objects across instances.
2. Use HTTP for server-to-server command forwarding.
3. Use the Socket.IO Redis Adapter for cross-server event broadcasting.

These decisions allow the existing Phase 1 game logic to be reused while introducing distributed communication.

## Known Limitations and Future Work

The following areas remain candidates for improvement:

- Server-to-server request authentication.
- Request timeout, retry, and idempotency handling.
- Redis room ownership TTL renewal and failure recovery.
- Handling unexpected client disconnections and reconnects.
- Recovery when a room-owning server becomes unavailable.
- Load testing with multiple server instances.
- Additional verification of room deletion and ownership release scenarios.

## Completion Criteria

Phase 2 establishes the basic distributed multiplayer architecture.

The core functionality includes:

- Room ownership discovery across server instances.
- Cross-server room joining and leaving.
- Cross-server game start and guess forwarding.
- Real-time event broadcasting across server instances.
- Authoritative room and game state maintained by the owning server.

Further reliability, security, and failure-recovery improvements remain future work.