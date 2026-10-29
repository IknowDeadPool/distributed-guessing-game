const EventEmitter = require("events");
const Game = require("../models/game");
require('dotenv').config();

class GameManagement extends EventEmitter {
    constructor(roomService) {
        super();
        this.Games = new Map();

        this.roomManagement = roomService;
        this.roundTimers = new Map();
        this.duration = process.env.ROUND_DURATION;
    }

    createGame(roomCode) {
        if (!this.validateCode(roomCode)) {
            throw new Error("Room Code should be valid");
        }

        if (this.Games.has(roomCode)) throw new Error("Game is already running");

        this.Games.set(roomCode, new Game(roomCode));

        return this.Games.get(roomCode);
    }

    startGame(roomCode, playerId) {
        const room = this.roomManagement.getRoom(roomCode);
        const game = this.getGame(roomCode);

        if (!room.players.has(playerId)) {
            throw new Error("Player does not belong to this room");
        }

        if (room.hostId !== playerId) {
            throw new Error("Only the host can start the game");
        }

        if (room.players.size < 2) {
            throw new Error("At least 2 players are required");
        }

        game.startRound();

        const roundNumber = game.roundNumber;

        const timer = setTimeout(() => {
            const currentGame = this.Games.get(roomCode);

            if (
                currentGame !== game ||
                game.getState() !== "IN_PROGRESS" ||
                game.roundNumber !== roundNumber
            ) {
                return;
            }

            this.finishRound(roomCode);

        }, this.duration);

        this.roundTimers.set(roomCode, timer);

        return {
            roundNumber: game.roundNumber,
            endsAt: game.endTime_Round,
            state: game.getState()
        };
    }

    submitGuess(roomCode, playerId, number) {
        if (!this.validateCode(roomCode) || !this.Games.has(roomCode)) {
            throw new Error("Room code should be valid");
        }

        if (!this.validateCode(playerId)) {
            throw new Error("Player ID should be valid");
        }

        if (!this.roomManagement.isPlayerInRoom(roomCode, playerId)) {
            throw new Error("Player is not in room");
        }

        const game = this.Games.get(roomCode);

        const result = game.submitGuess(playerId, number);

        if (result.result === "CORRECT") {
            const roundSummary = this.finishRound(
                roomCode,
                playerId,
                "CORRECT"
            );

            return {
                ...result,
                roundSummary
            };
        }

        return result;
    }
    finishRound(roomCode, winnerId = null, reason = "TIMEOUT") {
        const game = this.Games.get(roomCode);

        if (!game) {
            throw new Error("Game not found");
        }

        if (game.getState() !== "IN_PROGRESS") {
            return null;
        }

        const summary = game.finishRound(winnerId, reason);

        const timer = this.roundTimers.get(roomCode);

        if (timer) {
            clearTimeout(timer);
            this.roundTimers.delete(roomCode);
        }

        this.emit("roundFinished", {
            roomCode,
            ...summary
        });

        return summary;
    } X

    getGame(roomCode) {
        if (!this.validateCode(roomCode) || !this.Games.has(roomCode)) {
            throw new Error("Room Code should be valid");
        }
        return this.Games.get(roomCode);
    }

    removeGame(roomCode) {
        if (!this.validateCode(roomCode) || !this.Games.has(roomCode)) {
            throw new Error("Room Code should be valid");
        }
        const timer = this.roundTimers.get(roomCode);

        if (timer) {
            clearTimeout(timer);
            this.roundTimers.delete(roomCode);
        }

        return this.Games.delete(roomCode);
    }

    getPlayerScores(roomCode) {
        if (!this.validateCode(roomCode) || !this.Games.has(roomCode)) {
            throw new Error("Room Code should be valid");
        }
    }

    validateCode(code) {
        return typeof code === "string" && code.trim().length > 0;
    }

    handlePlayerLeft(roomCode, playerId) {
        const room = this.roomManagement.getRoom(roomCode);
        const game = this.Games.get(roomCode);

        if (!game) return;

        //game.playerScores.delete(playerId);

        if (game.getState() !== "IN_PROGRESS") {
            return;
        }

        if (room.players.size === 1) {
            const remainingPlayerId = room.players.keys().next().value;
            this.finishRound(roomCode, remainingPlayerId,
                "FORFEIT"
            );
        }

    }
}

module.exports = GameManagement;