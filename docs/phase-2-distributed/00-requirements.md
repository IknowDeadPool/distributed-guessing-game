# Phase 2 — Requirements

## Goal

Transform the existing single-instance multiplayer game into a distributed multiplayer backend without changing the fundamental game rules.

## Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Support multiple backend server instances simultaneously. |
| FR-02 | Allow players connected to different servers to join the same room. |
| FR-03 | Maintain consistent room membership across servers. |
| FR-04 | Allow cross-server game start and guess submission. |
| FR-05 | Ensure a single authoritative execution path for each game's state transitions. |
| FR-06 | Broadcast game events to all room participants, regardless of their connected server. |
| FR-07 | Enforce host permissions across server boundaries. |
| FR-08 | Handle player leave and disconnect events across servers. |
| FR-09 | Clean up empty rooms and their associated state. |
| FR-10 | Maintain consistent scoring, round results, and winners. |

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | Prevent conflicting game state updates and duplicate round completions. |
| NFR-02 | Keep gameplay interactions responsive across servers. |
| NFR-03 | Support adding backend instances without changing core game rules. |
| NFR-04 | Handle simultaneous requests predictably. |
| NFR-05 | Provide logs sufficient to trace cross-server requests. |
| NFR-06 | Preserve separation between game logic, coordination, and transport. |
| NFR-07 | Support integration testing with multiple backend instances. |

## Constraints

- Preserve existing Phase 1 gameplay rules.
- Reuse the existing Node.js and Socket.IO application.
- Start with two backend instances running locally.
- Evaluate infrastructure choices during design rather than assuming a specific solution upfront.

## Out of Scope

- Automatic recovery of in-memory game state after an owning server crashes.
- Production-grade multi-region deployment.
- Advanced autoscaling and load balancing.
- Full historical event replay.

These can be explored in later phases.

## Success Criteria

A player connected to Server A and a player connected to Server B can join the same room and complete a game while observing consistent state, scores, and events.
