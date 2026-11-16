# ShardPlay – Phase 3: Fault Tolerance & Recovery

A distributed real-time multiplayer game backend exploring fault tolerance, server failure detection, ownership management, state persistence, and recovery.

Phase 3 builds on the distributed architecture implemented in Phase 2 and focuses on making the system resilient to backend server failures.

## Project Overview

ShardPlay is a real-time multiplayer number-guessing game backend built to explore backend engineering and distributed systems concepts.

The project is developed incrementally across multiple phases:

- **Phase 1 – Single Instance:** Core multiplayer game functionality using Node.js, Express, and Socket.IO.
- **Phase 2 – Distributed Backend:** Multiple backend instances coordinated using Redis, HTTP request forwarding, and the Socket.IO Redis Adapter.
- **Phase 3 – Fault Tolerance & Recovery:** Server health monitoring, ownership leases, persistent game state, automatic failover, and recovery.

## Phase 3 Objectives

In Phase 2, room and game state are maintained in the memory of the server that owns the room.

If that server unexpectedly crashes, the room and active game state become unavailable.

Phase 3 addresses this limitation through:

- Server health monitoring using Redis heartbeats.
- Renewable ownership leases.
- Persistent room and game-state storage.
- Automatic ownership failover.
- Room and game-state recovery.
- Client reconnection and state synchronization.
- Reliability and failure testing.

## Technology Stack

- Node.js
- Express.js
- Socket.IO
- Redis
- Socket.IO Redis Adapter
- HTTP-based inter-server communication

## Current Architecture

Phase 3 retains the distributed architecture from Phase 2.

Each backend instance maintains its own in-memory room and game state. Redis is used for coordination and will be extended to support the recovery mechanisms introduced in this phase.

The implementation is being developed incrementally. Planned capabilities should not be considered implemented until their corresponding problems have been completed and tested.

## Documentation

### Phase 3 – Fault Tolerance & Recovery

- [Phase 3 Overview and Problem Tracker](docs/phase-3-fault-tolerance/README.md)
- [Phase 3 Requirements](docs/phase-3-fault-tolerance/00-requirements.md)
- [P01 – Server Health Monitoring](docs/phase-3-fault-tolerance/P01-server-health-monitoring.md)
- [P02 – Ownership Lease Management](docs/phase-3-fault-tolerance/P02-ownership-lease-management.md)
- [P03 – Persistent Game State](docs/phase-3-fault-tolerance/P03-persistent-game-state.md)
- [P04 – Automatic Failover](docs/phase-3-fault-tolerance/P04-automatic-failover.md)
- [P05 – Room and Game Recovery](docs/phase-3-fault-tolerance/P05-room-and-game-recovery.md)
- [P06 – Client Reconnection](docs/phase-3-fault-tolerance/P06-client-reconnection.md)
- [P07 – Reliability and Failure Testing](docs/phase-3-fault-tolerance/P07-reliability-and-failure-testing.md)

### Previous Phases

- [Phase 1 – Single Instance](https://github.com/IknowDeadPool/distributed-guessing-game/tree/phase/1-single-instance)
- [Phase 2 – Distributed Backend](https://github.com/IknowDeadPool/distributed-guessing-game/tree/phase/2-distributed)

## Development Status

Phase 3 is currently in progress.

| Problem | Description | Status |
|---|---|---|
| P01 | Server Health Monitoring | In progress |
| P02 | Ownership Lease Management | Planned |
| P03 | Persistent Game State | Planned |
| P04 | Automatic Failover | Planned |
| P05 | Room and Game Recovery | Planned |
| P06 | Client Reconnection | Planned |
| P07 | Reliability and Failure Testing | Planned |

## Development Approach

Each problem is approached through:

1. Requirements and problem definition.
2. Architecture and design decisions.
3. Incremental implementation.
4. Testing with multiple backend instances.
5. Failure-scenario verification.
6. Technical documentation.

## Repository

GitHub: https://github.com/IknowDeadPool/distributed-guessing-game

**Note:** This branch documents and implements Phase 3. Previous phases are maintained in their respective branches.