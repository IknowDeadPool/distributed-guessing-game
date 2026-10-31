const logger = require("../logging/logger");
const EVENTS = require("../logging/events");
const Room = require("../models/room");

function registerGameHandlers(io, socket, matchCoordinator) {

    // Create Game
    socket.on("game:start", (data, callback) => {
        // Validate host through GameManagement
        // Start round
        // Broadcast game:started
        // Acknowledge success/failure
        try {
            const roomCode = socket.data.roomCode;
            const playerId = socket.data.playerId;

            const normalizedCode = roomCode
                .trim()
                .toUpperCase();

            if (!roomCode || !playerId) {
                throw new Error("Player is not in a room");
            }

            const gameStart = matchCoordinator.startGame(normalizedCode, playerId);

            io.to(normalizedCode).emit(
                "game:started",

                matchCoordinator.getPublicMatchState(normalizedCode)
            );

            if (typeof callback === "function") {
                callback({
                    success: true,
                    ...gameStart
                });
            }
            logger.info({
                event: EVENTS.GAME_STARTED,
                gameCode: game.getCode(),
                roomCode: roomCode.getCode()
            }, "Game started successfully");

        }
        catch (error) {
            if (typeof callback === "function") {
                callback({
                    success: false,
                    message: error.message
                });
            }
        }
    });

    socket.on("game:guess", (data, callback) => {

        try {
            const roomCode = socket.data.roomCode;
            const playerId = socket.data.playerId;
            if (!data || typeof data !== "object") {
                throw new Error("Invalid guess payload");
            }

            if (!roomCode || !playerId) {
                throw new Error("Player is not in a room");
            }


            const normalizedCode = roomCode.trim().toUpperCase();

            const gameGuess = matchCoordinator.submitGuess(normalizedCode, playerId, data.number);

            callback?.({
                success: true,
                ...gameGuess,
            })

        }
        catch (error) {
            callback?.({
                success: false,
                message: error.message
            })
        }
    });



}



module.exports = registerGameHandlers;
