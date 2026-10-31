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

## Status

Problem reproduced and verified. Solution not yet implemented.
