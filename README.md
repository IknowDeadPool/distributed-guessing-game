# ShardPlay — Distributed Multiplayer Guessing Game

ShardPlay is a real-time multiplayer number-guessing game backend built to explore distributed systems, real-time communication, and scalable backend architecture.

The project is developed in phases, starting with a single-server implementation and progressively introducing distributed functionality across multiple backend instances.

**This repository currently contains the backend only. There is no frontend or browser-based playable interface.** All game interactions can be tested using Postman and Socket.IO clients.

## Project Overview

Players can create and join multiplayer rooms, start game sessions, submit guesses, and receive real-time game updates.

The backend uses Node.js, Express, and Socket.IO. The distributed implementation introduces Redis-backed room ownership, cross-server HTTP communication, and the Socket.IO Redis Adapter.

## Technology Stack

- **Runtime:** Node.js
- **HTTP Framework:** Express
- **Real-time Communication:** Socket.IO
- **Distributed Coordination:** Redis
- **Cross-server Communication:** HTTP
- **Socket.IO Scaling:** `@socket.io/redis-adapter`
- **Logging:** Pino
- **Testing:** Postman and Node.js test scripts

## Project Architecture

ShardPlay is developed in two phases:

### Phase 1 — Single-Instance Architecture

The initial implementation runs the entire game on a single backend instance.

- Room creation and management
- Player joining and leaving
- Host transfer and room cleanup
- Game lifecycle management
- Guess validation and scoring
- Real-time communication through Socket.IO

[View Phase 1 — Single-Instance Implementation](https://github.com/IknowDeadPool/distributed-guessing-game/tree/phase/1-single-instance)

### Phase 2 — Distributed Architecture

The second phase extends the system to support multiple independent backend instances.

- Redis-backed room ownership
- Cross-server room discovery and joining
- Cross-server room leaving
- HTTP-based command forwarding
- Socket.IO event broadcasting using the Redis Adapter
- Authoritative room and game state maintained by the owning server

[View Phase 2 — Distributed Implementation](https://github.com/IknowDeadPool/distributed-guessing-game/tree/phase/2-distributed)

## Repository Structure

```text
distributed-guessing-game/
│
├── backend/
│   ├── src/
│   ├── tests/
│   └── package.json
│
├── docs/
│   └── phase-2-distributed/
│
└── README.md
```

## Getting Started

To run the backend, first clone the repository:

```bash
git clone https://github.com/IknowDeadPool/distributed-guessing-game.git
cd distributed-guessing-game
```

Choose the implementation you want to explore:

**Phase 1:**

```bash
git switch phase/1-single-instance
cd backend
npm install
npm start
```

**Phase 2:**

```bash
git switch phase/2-distributed
cd backend
npm install
```

Phase 2 additionally requires Redis and two backend instances. Follow the corresponding phase README for complete setup and testing instructions.

## Testing

The project can be tested without a frontend.

- Use Postman to connect to the backend through Socket.IO.
- Emit client events and inspect server responses.
- Listen for real-time events.
- Use multiple Postman connections to simulate different players.
- For Phase 2, connect clients to different backend instances to verify distributed functionality.

The backend also provides the following Node.js test scripts:

```bash
npm run test:game
npm run test:room
npm run test:redis
```

See the phase-specific documentation for setup and testing details.

## Documentation

- [Phase 1 — Single-Instance Architecture](https://github.com/IknowDeadPool/distributed-guessing-game/tree/phase/1-single-instance)
- [Phase 2 — Overview and Problem Tracker](https://github.com/IknowDeadPool/distributed-guessing-game/blob/phase/2-distributed/docs/phase-2-distributed/README.md)
- [Phase 2 — Requirements](https://github.com/IknowDeadPool/distributed-guessing-game/blob/phase/2-distributed/docs/phase-2-distributed/00-requirements.md)
- [Phase 2 — Implementation Documentation](https://github.com/IknowDeadPool/distributed-guessing-game/tree/phase/2-distributed/docs/phase-2-distributed)

## Project Goals

This project is an exploration of how a real-time multiplayer application evolves from a single-server architecture into a distributed backend system.

The focus is on understanding room ownership, state consistency, inter-server communication, event distribution, and the challenges involved in scaling real-time applications.

**Current focus:** Backend architecture and distributed functionality. A frontend and further reliability improvements are future work.