# Phase 3 – Fault Tolerance and Recovery

## Objective

Phase 3 focuses on making ShardPlay more resilient to server failures.

In Phase 2, multiple backend instances can coordinate room operations and game commands using Redis, HTTP forwarding, and the Socket.IO Redis Adapter.

However, each room and its active game state still live in the memory of the server that owns them.

If that server crashes, Redis may still identify it as the owner, while the actual room and game state are no longer available.

The objective of Phase 3 is to explore how a distributed game backend can detect server failures, manage ownership safely, recover state, and allow disconnected players to reconnect.

## Starting Point

Phase 3 builds on the Phase 2 distributed architecture.

Existing components include:

- Multiple Node.js backend instances.
- Redis-backed room ownership.
- HTTP forwarding of cross-server room and game commands.
- Socket.IO Redis Adapter for cross-server event broadcasting.
- Server directory containing known server IDs and addresses.

The existing architecture is retained as the starting point. Phase 3 will introduce reliability and recovery capabilities incrementally.

## Problem Tracker

| ID | Problem | Status |
|---|---|---|
| P01 | Server Health Monitoring | In progress |
| P02 | Ownership Lease Management | Planned |
| P03 | Persistent Game State | Planned |
| P04 | Automatic Failover | Planned |
| P05 | Room and Game Recovery | Planned |
| P06 | Client Reconnection | Planned |
| P07 | Reliability and Failure Testing | Planned |

Status definitions:

- **Planned:** Not yet implemented.
- **In progress:** Design or implementation has started.
- **Implemented:** Implementation is complete but may still need verification.
- **Tested:** Acceptance tests have passed.

## Planned Architecture

Phase 3 will build on the following responsibilities:

### Backend server instances
- Handle client connections and game operations.
- Publish periodic heartbeats.
- Participate in ownership and recovery workflows.

### Redis
- Track server heartbeat keys.
- Manage room ownership information.
- Support future ownership lease and state recovery mechanisms.

### Failure detection
- Monitor the availability of known server instances.
- Identify missing or expired heartbeats.
- Distinguish observed unavailability from confirmed server failure.

### Recovery
- Persist the state required to reconstruct rooms and active games.
- Allow a replacement server to acquire ownership safely.
- Restore game state and support player reconnection.

The exact persistence, lease, and recovery mechanisms will be designed and documented before their implementation.

## Implementation Approach

Each problem will follow this workflow:

1. Define the problem and requirements.
2. Investigate the existing Phase 2 implementation.
3. Design the proposed solution.
4. Implement the solution incrementally.
5. Test normal operation and failure scenarios.
6. Document implementation details and design decisions.

## Completion Criteria

Phase 3 will be considered complete when the system can demonstrate:

- Detection of an unavailable backend instance.
- Safe ownership transfer after an owner becomes unavailable.
- Recovery of room and game state on another server.
- Player reconnection and state synchronization.
- Protection against conflicting ownership during concurrent failover attempts.
- Successful reliability and failure testing.

## Known Limitations

The following capabilities are not yet implemented as part of Phase 3:

- Dynamic server registration and discovery.
- Renewable ownership leases and stale-owner protection.
- Durable room and game-state persistence.
- Automatic ownership failover.
- Game-state recovery.
- Client reconnection and recovery synchronization.
- Comprehensive failure and load testing.

These will be addressed through the problems listed above.