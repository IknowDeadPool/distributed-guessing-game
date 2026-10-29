const { io } = require("socket.io-client");
const { setTimeout: sleep } = require("node:timers/promises");
const assert = require("node:assert/strict");

const URL = "http://localhost:3001";

const host = io(URL, { autoConnect: false });
const playerB = io(URL, { autoConnect: false });
const playerC = io(URL,{autoConnect : false});

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

        const roomCode = room.roomCode;
        console.log("Room created:", roomCode);

        // 2. Join room
        await emit(playerB, "room:join", {
            roomCode,
            playerName: "Player B"
        });

        await emit(playerC, "room:join",{
            roomCode,
            playerName : "Player C"
        })

        await emit()
        

        console.log("TEST COMPLETED");

    } catch (error) {
        console.error("TEST FAILED:", error.message);
        process.exitCode = 1;
    } finally {
        host.disconnect();
        playerB.disconnect();
        playerC.disconnect();
    }
}

runTest();