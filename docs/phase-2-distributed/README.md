# Phase 2 — Distributed Multiplayer Guessing Game

## Objective

Extend the Phase 1 single-instance multiplayer guessing game to support multiple Node.js server instances while maintaining consistent room membership, game state, scoring, and real-time communication.

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

See [Phase 2 Requirements](00-requirements.md).

## Problem Tracker

| ID | Problem | Status | Documentation |
|---|---|---|---|
| P01 | Cross-server room discovery | Not started | — |

Additional problems will be added as they are discovered.

## Architecture Decisions

Decisions will be documented in `decisions/` as they are made.

## Experiments

Experiments and their observations will be recorded in `experiments/`.

## Completion Criteria

Phase 2 is complete when players connected to different backend instances can participate in the same room, submit guesses, receive synchronized events, and observe consistent game results.
