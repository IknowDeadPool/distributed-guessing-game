
const crypto = require("crypto");
class MatchCoordinator {
    constructor(roomService, gameService, ownershipRegistry, serverId) {
        this.roomService = roomService;
        this.gameService = gameService;
        this.ownershipRegistry = ownershipRegistry;
        this.serverId = serverId;
    }

    async createRoom(roomSize, player) {
        if (roomSize < 2 || roomSize > 10) throw new Error("Players can only be between 2 and 10");

        let roomCode;
        let reserved = false;

        for (let attempt = 0; attempt < 5; attempt++) {
            roomCode = crypto.randomBytes(3)
                .toString("hex")
                .toUpperCase();

            reserved = await this.ownershipRegistry.reserveRoom(
                roomCode,
                this.serverId
            );
            if (reserved) break;
        }
        const room = this.roomService.createRoom(roomCode, roomSize);
        const normalizedCode = room.getCode()
            .trim()
            .toUpperCase();

        try {
            const game = this.gameService.createGame(normalizedCode);

            console.log("Player ID :", player.getId());
            console.log("Room ID :", room.getCode());
            console.log("game Created for - ", room.getCode());

            this.roomService.joinRoom(room.getCode(), player);
            room.setHost(player.getId());
            return { room, game };
        }
        catch (error) {
            await this.ownershipRegistry.releaseRoom(
                roomCode,
                this.serverId
            );
            throw error;
        }


    }


    joinRoom(roomCode, player) {
        const room = this.roomService.joinRoom(roomCode, player);

        const game = this.gameService.getGame(roomCode);

        game.addPlayer(player.getId());

        return room;
    }

    leaveRoom(roomCode, playerId) {
        // Coordinate room removal and game cleanup



        const updatedRoom = this.roomService.leaveRoom(roomCode, playerId);

        if (updatedRoom === null) {
            this.gameService.removeGame(roomCode);

            return {
                roomDeleted: true,
                roomCode
            };
        }


        this.handlePlayerLeft(roomCode);



        return {
            roomDeleted: false,
            roomCode,
            roomInfo: this.getPublicMatchState(roomCode)
        }

    }

    getPublicMatchState(roomCode) {
        const room = this.roomService.getRoom(roomCode);
        const game = this.gameService.getGame(roomCode);

        return {
            roomCode,
            roomStatus: room.status,
            hostId: room.hostId,
            gameState: game.getState(),
            roundNumber: game.roundNumber,
            endsAt: game.endTime_Round,
            players: [...room.players.values()].map(player => ({
                playerId: player.id,
                name: player.name,
                score: game.playerScores.get(player.id) ?? 0,
                isHost: room.hostId === player.id
            }))
        };

    }

    startGame(roomCode, playerId) {
        const room = this.roomService.getRoom(roomCode);

        if (!room.players.has(playerId)) {
            throw new Error("Player does not belong to this room");
        }

        if (room.hostId !== playerId) {
            throw new Error("Only the host can start the game");
        }

        if (room.players.size < 2) {
            throw new Error("At least 2 players are required");
        }

        return this.gameService.startGame(roomCode, playerId)
    }


    submitGuess(roomCode, playerId, number) {
        if (!this.roomService.isPlayerInRoom(roomCode, playerId)) {
            throw new Error("Player is not in room");
        }

        return this.gameService.submitGuess(roomCode, playerId, number);
    }



    handlePlayerLeft(roomCode) {
        const room = this.roomService.getRoom(roomCode);
        const game = this.gameService.getGame(roomCode);

        if (!room || !game) return;

        if (
            game.getState() === "IN_PROGRESS" &&
            room.players.size === 1
        ) {
            const remainingPlayerId = room.players.keys().next().value;

            this.gameService.finishRound(
                roomCode,
                remainingPlayerId,
                "FORFEIT"
            );
        }
    }

}

module.exports = MatchCoordinator;