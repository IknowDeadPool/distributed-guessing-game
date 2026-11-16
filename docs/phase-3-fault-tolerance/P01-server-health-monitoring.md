# P01 – Server Health Monitoring

## 1. Objective

The objective of P01 is to introduce basic server health monitoring into ShardPlay.

Each backend instance periodically publishes a heartbeat to Redis. Other known instances check whether those heartbeat keys exist.

If a server stops publishing heartbeats, its Redis key eventually expires, allowing other instances to identify that it may be unavailable.

## 2. Problem

In a distributed environment, backend instances can become unavailable unexpectedly.

Without health monitoring, other servers have no basic mechanism to determine whether a known instance is still publishing signs of life.

P01 introduces a heartbeat mechanism to address this problem.

## 3. Implementation

### 3.1 ServerHeartbeatController

File:

`backend/src/infrastructure/ServerHeartbeatController.js`

The controller contains two operations:

**setServerState(serverId)**

- Creates or updates a Redis key for the specified server.
- Uses the key format `server:{serverId}:alive`.
- Stores the value `true`.
- Sets a five-second expiration using Redis `EX`.

**isServerAlive(serverId)**

- Checks whether the server's heartbeat key exists.
- Uses Redis `EXISTS`.
- Returns `true` when the key exists and `false` otherwise.

### 3.2 Heartbeat Publishing

Each server publishes its heartbeat every two seconds.

The heartbeat key has a five-second TTL.

Every successful heartbeat refreshes the expiration time.

Current configuration:

| Setting | Value |
|---|---:|
| Heartbeat interval | 2 seconds |
| Heartbeat TTL | 5 seconds |
| Health-check interval | 3 seconds |

### 3.3 ServerDirectory

File:

`backend/src/infrastructure/ServerDirectory.js`

The ServerDirectory maintains a mapping between known server IDs and their addresses.

Current local development configuration:

| Server ID | Address |
|---|---|
| server-A | http://localhost:3001 |
| server-B | http://localhost:3002 |

The `getAllServerIds()` method returns the configured server IDs.

The `getAddress(serverId)` method retrieves the address associated with a server ID.

This implementation uses a static directory for local development. Dynamic server registration is not part of P01.

### 3.4 Monitoring Logic

The `monitorServers()` function in `server.js` performs two operations:

**Heartbeat publishing**

- Publishes the current server's heartbeat every two seconds.

**Health checking**

- Runs every three seconds.
- Retrieves the known server IDs from ServerDirectory.
- Skips the current server.
- Checks the heartbeat of every other known server.
- Logs when a server transitions from available to unavailable.
- Logs when a previously unavailable server becomes available again.

An in-memory Map tracks the previously observed health state to avoid repeatedly logging the same transition.

## 4. Redis Key Structure

Example keys:

`server:server-A:alive`

`server:server-B:alive`

Expected behavior:

- A running server periodically refreshes its key.
- If the server stops publishing heartbeats, the key expires after five seconds.
- Other servers eventually observe that the key no longer exists.
- When the server restarts and publishes another heartbeat, its key reappears.

## 5. Failure Detection Considerations

A missing heartbeat does not necessarily prove that a server has crashed.

For example:

1. Server A is running.
2. Server A temporarily loses connectivity to Redis.
3. Server B cannot find Server A's heartbeat.
4. Server B considers Server A potentially unavailable.
5. Server A may still be running and processing requests.

This is a limitation of basic heartbeat-based failure detection.

P01 identifies potential server unavailability. It does not establish definitive proof of a crash.

Ownership safety and failover will be handled in later problems.

## 6. Current Limitations

- Server registration is static.
- Heartbeat publishing and health checks require explicit error handling.
- Health checks may overlap if a previous asynchronous check takes too long.
- The initial health state is assumed to be available until the first check.
- The current shutdown handler handles SIGINT but not SIGTERM.
- Health information is used for logging and monitoring only.
- No automatic ownership transfer occurs when a server becomes unavailable.
- No room or game-state recovery is implemented.

These limitations will be addressed where appropriate in subsequent problems.

## 7. Testing Plan

Testing will use two independent backend instances and Redis.

### Test 1: Start Redis

```bash
docker start guessing-game-redis
docker exec guessing-game-redis redis-cli ping
```

Expected result:

`PONG`

### Test 2: Start Server A

```powershell
$env:PORT="3001"
$env:SERVER_ID="server-A"
$env:REDIS_URL="redis://localhost:6379"
npm start
```

### Test 3: Start Server B

In another terminal:

```powershell
$env:PORT="3002"
$env:SERVER_ID="server-B"
$env:REDIS_URL="redis://localhost:6379"
npm start
```

### Test 4: Verify Heartbeats

Open Redis CLI:

```bash
docker exec -it guessing-game-redis redis-cli
```

Execute:

```redis
EXISTS server:server-A:alive
TTL server:server-A:alive
EXISTS server:server-B:alive
TTL server:server-B:alive
```

Expected result:

- Both keys exist.
- Their TTL values are positive.
- Their expiration times are periodically refreshed.

### Test 5: Simulate Unexpected Server Failure

Terminate Server A forcefully without allowing its shutdown handler to execute.

Wait for the heartbeat key to expire.

Verify:

```redis
EXISTS server:server-A:alive
```

Expected result:

`0`

Server B should log that Server A is unavailable.

### Test 6: Restart Server A

Start Server A again using the same configuration.

Verify that its heartbeat key reappears and Server B detects the transition back to available.

## 8. Acceptance Criteria

P01 can be marked as tested when:

- Both instances successfully publish heartbeats.
- Redis expiration works as expected.
- Server B detects Server A's missing heartbeat after forced termination.
- Server B detects Server A returning after restart.
- Redis errors are handled without unhandled promise rejections.

## 9. Status

**In progress – Implementation started; failure testing pending.**

No automatic failover or ownership transfer is included in P01.