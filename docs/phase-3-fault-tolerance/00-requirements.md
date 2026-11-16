# Phase 3 – Requirements

## 1. Purpose

The purpose of Phase 3 is to improve the fault tolerance of ShardPlay's distributed backend.

The system currently supports multiple backend instances, but room and game state are held in the memory of the owning server.

A failure of that server can make its rooms and active games unavailable.

Phase 3 introduces server health monitoring, safer ownership management, persistent state, failover, recovery, and client reconnection.

## 2. Scope

### In scope

- Server heartbeat publishing.
- Server availability monitoring.
- Detection of missing or expired heartbeats.
- Renewable room ownership leases.
- Protection against stale ownership.
- Persistent room and game state.
- Automatic ownership failover.
- Room and game-state recovery.
- Client reconnection.
- Failure and reliability testing.

### Out of scope

The following are not primary goals of this phase:

- Kubernetes orchestration.
- Microservices migration.
- Introducing Kafka.
- Building a frontend application.
- Large-scale production deployment.

These may be considered separately if future requirements justify them.

## 3. Functional Requirements

### FR-01: Server Health Monitoring

Each backend instance must periodically publish a heartbeat to Redis.

Other instances must be able to check whether a known server's heartbeat is present.

Expired or missing heartbeats must be treated as evidence that a server may be unavailable.

### FR-02: Ownership Lease Management

Room ownership must use renewable leases rather than relying only on a basic ownership key.

The system must prevent an expired or stale owner from continuing to act as the authoritative owner.

### FR-03: Persistent Game State

The system must persist sufficient room and game information to recover an active game after an owning server failure.

The required state and persistence frequency must be defined during the design of P03.

### FR-04: Automatic Failover

When an owning server becomes unavailable, another eligible server must be able to acquire ownership safely.

The system must prevent two servers from simultaneously acting as the authoritative owner.

### FR-05: Room and Game Recovery

A replacement owner must be able to reconstruct the room and game from persisted state.

Recovery behavior must define how to handle operations that occurred after the most recent persisted state.

### FR-06: Client Reconnection

Players who lose their server connection must be able to reconnect.

The server must identify the player's active room and provide the appropriate recovered game state.

### FR-07: Reliability Testing

The system must be tested under normal operation and failure conditions, including:

- Unexpected server termination.
- Redis unavailability.
- Expired heartbeats.
- Ownership expiration.
- Concurrent failover attempts.
- Duplicate requests.
- Reconnection after recovery.

## 4. Non-Functional Requirements

### Consistency

Only one server should be authoritative for a room at a time.

### Fault Tolerance

The system should recover from an individual backend instance failure where the required persisted state remains available.

### Reliability

Temporary communication failures should not silently corrupt ownership or game state.

### Observability

Important events such as heartbeat expiration, ownership changes, recovery, and reconnection should be logged.

### Maintainability

New functionality should be implemented using the existing project structure and documented architectural decisions.

## 5. Testing Requirements

Testing will use multiple local backend instances, Redis, and Postman.

The tests should verify:

1. Heartbeats are created and renewed.
2. Heartbeats expire after a server stops publishing them.
3. Other servers detect the missing heartbeat.
4. Ownership can be safely transferred.
5. Recovered state matches the persisted state.
6. Players can reconnect and receive the correct state.
7. Concurrent recovery attempts do not produce multiple authoritative owners.

## 6. Acceptance Criteria

Phase 3 is accepted when the system demonstrates that an active room can survive the unexpected failure of its owning server, recover on another server, and allow its players to continue according to the defined recovery policy.

All acceptance scenarios must have documented test results.