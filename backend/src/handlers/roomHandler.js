const Player = require("../models/player");
const generateServerRandomName = require("../utils/nameGenerator")

const crypto = require("crypto");

function registerRoomHandlers(io, socket, roomService, gameService, matchCoordinator) {

    // Create Room
    socket.on("room:create", (data, callback) => {
        try {
            if (socket.data.roomCode) {
                throw new Error("Player is already in the room");
            }

            const name = data.playerName.trim();

            const playerName = !name ? generateServerRandomName() : name;
            const roomSize = (data.roomSize < 2 || data.roomSize > 10) ? 10 : data.roomSize;

            const player = new Player(crypto.randomUUID(), playerName);
            const room = roomService.createRoom(roomSize);
            const game = gameService.createGame(room.getCode());


            console.log("Player ID :", player.getId());
            console.log("Room ID :", room.getCode());
            console.log("game Created for - ", room.getCode());

            roomService.joinRoom(room.getCode(), player);
            room.setHost(player.getId());

            socket.join(room.getCode());

            socket.data.roomCode = room.getCode();
            socket.data.playerId = player.getId();

            console.log(player.name);
            callback?.({
                success: true,
                roomCode: room.getCode(),
                hostId: player.getId(),
                gameState: game.getState(),
                status: room.status
            });
        }
        catch (error) {
            callback?.({
                success: false,
                error: error.message
            });
        }
    });

    // join room

    socket.on('room:join', (data, callback) => {
        try {
            if (socket.data.roomCode) {
                throw new Error("Player already in a room");
            }
            const playerName = data.playerName;
            const roomCode = data.roomCode;

            if (
                typeof roomCode !== "string" ||
                !roomCode.trim()
            ) {
                throw new Error("Room code is required");
            }

            const normalizedCode = roomCode
                .trim()
                .toUpperCase();

            //const room = roomService.getRoom(normalizedCode);

            const player = new Player(crypto.randomUUID(), playerName);


            const updatedRoom = roomService.joinRoom(normalizedCode, player);

            socket.join(normalizedCode);

            socket.data.roomCode = normalizedCode;
            socket.data.playerId = player.getId();

            io.to(normalizedCode).emit(
                "room:playersUpdated",
                //updatedRoom.getRoomInfo()
                matchCoordinator.getPublicMatchState(normalizedCode),
                //updatedRoom
            );

            callback?.({
                success: true,
                playerId: player.getId(),
            })
        }

        catch (error) {
            callback?.({
                success: false,
                message: error.message
            })
        }
    })
    // Leave Room
    socket.on("room:leave", (callback) => {
        try {

            const roomCode = socket.data.roomCode;
            const playerId = socket.data.playerId;

            if (
                typeof roomCode !== "string" ||
                !roomCode.trim()
            ) {
                throw new Error("Room code is required");
            }

            const normalizedCode = roomCode
                .trim()
                .toUpperCase();


            matchCoordinator.leaveRoom(normalizedCode, playerId);

            socket.leave(normalizedCode);

            socket.data.roomCode = null;
            socket.data.playerId = null;

            io.to(normalizedCode).emit(
                "room:playersUpdated",
                //updatedRoom.getRoomInfo()
                matchCoordinator.getPublicMatchState(normalizedCode)
            );

            if (typeof callback === "function") {


                callback?.({
                    success: true,
                    message: "player left successfully"
                })
            }
        }
        catch (error) {
            if (typeof callback === "function") {

                callback?.({
                    success: false,
                    message: error.message
                })
            }
        }
    })
}



module.exports = registerRoomHandlers;