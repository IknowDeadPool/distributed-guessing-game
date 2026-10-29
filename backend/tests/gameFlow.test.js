const { io } = require("socket.io-client");
const { setTimeout: sleep } = require("node:timers/promises");
const assert = require("node:assert/strict");

const URL = "http://localhost:3001";

const host = io(URL, { autoConnect: false });
const player = io(URL, { autoConnect: false });

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
            connect(player)
        ]);

        console.log("Both players connected");

        host.on("game:started", data => {
            console.log("HOST - game started:", data);
        });

        player.on("game:ended", data => {
            console.log("PLAYER - round ended:", data);
        });

        // 1. Create room
        const room = await emit(host, "room:create", {
            playerName: "Player A",
            roomSize: 2
        });

        const roomCode = room.roomCode;
        console.log("Room created:", roomCode);

        // 2. Join room
        await emit(player, "room:join", {
            roomCode,
            playerName: "Player B"
        });

        // 3. Start game
        await emit(host, "game:start");
        await sleep(501);

        // 4. Submit guess
        const response = await player
            .timeout(5000)
            .emitWithAck("game:guess", { number: 50 });

        console.log(response);

        assert.equal(response.success, false);
        assert.equal(response.message, "Game is not in progress");

        console.log("PASS: Guess rejected after timeout");

        //console.log("Guess result:", guess.result);



        const nextRound = await emit(host, "game:start", {});

        assert.equal(nextRound.roundNumber, 2);
        assert.equal(nextRound.state, "IN_PROGRESS");

        console.log("PASS: Round 2 started successfully");

        console.log("TEST COMPLETED");

    } catch (error) {
        console.error("TEST FAILED:", error.message);
        process.exitCode = 1;
    } finally {
        host.disconnect();
        player.disconnect();
    }
}

runTest();