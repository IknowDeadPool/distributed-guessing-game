# ShardPlay — Phase 1: Single-Instance Backend

Phase 1 implements the initial version of ShardPlay, a real-time multiplayer number-guessing game running on a single backend server.

The purpose of this phase is to establish the core game functionality before introducing distributed architecture.

**This phase contains the backend only. There is no frontend.** Players and game interactions can be simulated using Postman with Socket.IO support.

## 1. Architecture

The application runs as a single Node.js process.

```text
              Postman Client A
                     |
                     |
              Postman Client B
                     |
                     v
             Socket.IO Server
                     |
                     v
              MatchCoordinator
                     |
             +-------+-------+
             |               |
             v               v
       RoomManagement   GameManagement
             |               |
             v               v
          Room State      Game State
          (Memory)        (Memory)
```

All room and game state is maintained in the memory of the running server.

There is no Redis dependency in this phase.

## 2. Technology Stack

- Node.js
- Express
- Socket.IO
- JavaScript (CommonJS)
- Postman for manual API and Socket.IO testing

## 3. Game Rules

The initial game implementation follows these rules:

| Rule | Description |
|---|---|
| Minimum players | 2 |
| Maximum players | 10 |
| Room code | 6-character uppercase hexadecimal code |
| Secret number | Random number between 1 and 100 |
| Round duration | 60 seconds |
| Maximum rounds | 3 |
| Guess cooldown | 2 seconds per player |
| Correct guess | 10 points |

The host manages the room and can start the game. If the host leaves, host ownership is transferred according to the room management logic.

An empty room is deleted.

## 4. Getting Started

### Prerequisites

- Node.js (supported LTS version)
- npm
- Git
- Postman

### Clone the repository

```bash
git clone https://github.com/IknowDeadPool/distributed-guessing-game.git
cd distributed-guessing-game
```

Switch to Phase 1:

```bash
git switch phase/1-single-instance
```

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm start
```

For development:

```bash
npm run dev
```

The server listens on the port configured in `src/server.js`.

## 5. Testing with Postman

No frontend is required to test the game.

Postman can connect to the Socket.IO server and simulate multiple players.

### Step 1 — Connect the first player

1. Open Postman.
2. Create a new Socket.IO request.
3. Enter the server URL configured by the backend.
4. Connect.

This connection represents Player 1.

### Step 2 — Create a room

Emit the room creation event implemented by the backend.

Use the event name and payload from the corresponding Postman request or Socket.IO handler.

Record the generated room code.

### Step 3 — Connect another player

Create a second Socket.IO request and connect another client to the same server.

This represents Player 2.

### Step 4 — Join the room

Emit the room joining event with the room code and the required player information.

Verify that the joining player is added and that the room state is updated.

### Step 5 — Test game operations

Use the game events implemented by the backend to:

- Start a game.
- Submit guesses.
- Verify correct and incorrect guesses.
- Check scoring.
- Observe round progression.
- Verify game completion.

### Step 6 — Test room management

Verify the following cases:

- A player leaves the room.
- The host leaves the room.
- Host ownership is transferred.
- A room is deleted when its last player leaves.
- Invalid room operations are rejected.

## 6. Available Test Scripts

The backend provides these test commands:

```bash
npm run test:game
npm run test:room
npm run test:redis
```

Run them individually from the backend directory.

The default `npm test` command is currently a placeholder and does not execute the test suite.

The Redis test requires a reachable Redis instance, if its test implementation uses the configured Redis connection.

## 7. Manual Testing Results

The Phase 1 implementation was manually tested across 21 scenarios.

The tested functionality covered room management, player operations, game lifecycle, guessing, and scoring.

## 8. Limitations

Phase 1 is intentionally a single-instance implementation.

- Room and game state are held in process memory.
- Rooms cannot be discovered across independent server instances.
- Restarting the server loses in-memory game state.
- There is no frontend.
- There is no distributed ownership or cross-server command forwarding.

These limitations provide the motivation for Phase 2.

## 9. Next Phase

Phase 2 extends the single-instance implementation into a distributed backend using Redis and multiple independent server instances.

[Explore Phase 2 — Distributed Architecture](https://github.com/IknowDeadPool/distributed-guessing-game/tree/phase/2-distributed)

---

**Phase 1 establishes the core multiplayer game functionality and serves as the baseline for the distributed implementation.**