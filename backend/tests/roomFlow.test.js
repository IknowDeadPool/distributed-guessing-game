const { io } = require("socket.io-client");

const assert = require("node:assert/strict");

const URL = "http://localhost:3001";

const host = io(URL, { autoConnect: false });
const playerB = io(URL, { autoConnect: false });
const playerC = io(URL, { autoConnect: false });
const playerD = io(URL, { autoConnect: false });

async function connect(socket) {
    return new Promise((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("connect_error", reject);
        socket.connect();
    });
}

async function emit(socket, event, data = {}) {
    const response = await socket
        .timeout(5000)
        .emitWithAck(event, data);

    if (!response?.success) {
        throw new Error(
            `${event}: ${response?.message || "Unknown error"}`
        );
    }
    console.log(event, response);
    return response;
}

async function runTest() {
    try {
        await Promise.all([
            connect(host),
            connect(playerC),
            connect(playerB)
        ]);

        console.log("All players connected");

        // 1. Create room
        const room = await emit(host, "room:create", {
            playerName: "Player A",
            roomSize: 3
        });

        assert.equal(room.success, true);
        assert.ok(room.roomCode);
        assert.equal(room.gameState, "WAITING");
        assert.equal(room.status, "OPEN");
        assert.ok(room.hostId);

        const roomCode = room.roomCode;
        console.log("Room created:", roomCode);

        // 2. Join room
        await emit(playerB, "room:join", {
            roomCode,
            playerName: "Player B"
        });
        const statePromise = waitForEvent(
            host,
            "match:stateUpdated"
        );

        await emit(playerC, "room:join", {
            roomCode,
            playerName: "Player C"
        })


        const state = await statePromise;

        assert.equal(state.players.length, 3);
        assert.equal(state.hostId, room.hostId);
        assert.equal(state.gameState, "WAITING");



        // assert.deepEqual(
        //     new Set(state.players.map(player => player.name)),
        //     new Set(["Player A", "Player B", "Player C"])
        // );

        // assert.equal(
        //     state.players.filter(player => player.isHost).length,
        //     1
        // );

        // assert.equal(
        //     state.players.find(player => player.isHost).playerId,
        //     room.hostId
        // );


        await connect(playerD);

        const response = await playerD
            .timeout(5000)
            .emitWithAck("room:join", {
                roomCode,
                playerName: "Player D"
            });

        assert.equal(response.success, false);

        console.log("TEST COMPLETED");

    } catch (error) {
        console.error("TEST FAILED:", error.message);
        process.exitCode = 1;
    } finally {
        host.disconnect();
        playerB.disconnect();
        playerC.disconnect();
        playerD.disconnect();
    }
}


function waitForEvent(socket, event, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off(event, onEvent);
            reject(new Error(`Timed out waiting for ${event}`));
        }, timeoutMs);

        function onEvent(data) {
            clearTimeout(timer);
            resolve(data);
        }

        socket.once(event, onEvent);
    });
}


runTest();