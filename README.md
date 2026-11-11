# ShardPlay — Distributed Multiplayer Guessing Game

A real-time multiplayer number-guessing game built to explore distributed systems, backend architecture, scalability, and fault tolerance.

ShardPlay started as a single-server multiplayer application and is evolving into a distributed backend where multiple Node.js server instances coordinate room ownership, game operations, and real-time communication.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Real-time communication:** Socket.IO
- **Distributed coordination:** Redis
- **Cross-server broadcasting:** Socket.IO Redis Adapter
- **Inter-server communication:** HTTP
- **Development environment:** Docker

## Architecture

The distributed architecture currently follows these principles:

- Each game room has one authoritative server responsible for its Room and Game state.
- Redis maintains room ownership metadata so server instances can discover the responsible server.
- HTTP request forwarding allows operations to reach the server that owns a room.
- Socket.IO Redis Adapter distributes real-time events across server instances.
- Game state remains on the owning server rather than being replicated across all instances.

## Project Progress

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Single-instance multiplayer backend | Completed |
| Phase 2 | Distributed multiplayer architecture | Core implementation completed |

### Phase 1 — Single Instance

Implemented room management, player membership, host transfer, game rounds, scoring, guess validation, and real-time Socket.IO communication.

### Phase 2 — Distributed Architecture

Implemented:

- Redis-backed room ownership.
- Cross-server room discovery and joining.
- Cross-server room leaving and event broadcasting.
- Cross-server game start and guess forwarding.
- Authoritative room and game state management.

Reliability, authentication, failure recovery, and additional load testing remain areas for improvement.

## Running the Project

The backend supports running multiple independent server instances locally.

For development, configure each instance with its own:

- `PORT`
- `SERVER_ID`

Both instances connect to the shared Redis service.

See the backend setup instructions for the exact environment variables and startup commands.

## Documentation

Detailed technical documentation and the implementation journey:

- [Phase 2 Overview and Problem Tracker](./docs/phase-2-distributed/README.md)
- [Phase 2 Requirements](./docs/phase-2-distributed/00-requirements.md)
- [Phase 2 Implementation Documentation](./docs/phase-2-distributed/)

## Repository

[GitHub Repository](https://github.com/IknowDeadPool/distributed-guessing-game)

---

This project is actively evolving as I explore distributed backend architecture through implementation, experiments, and testing.