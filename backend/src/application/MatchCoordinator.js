
const crypto = require("crypto");
class MatchCoordinator {
    constructor(roomService, gameService, ownershipRegistry, serverId, roomRequestForwarder,gameRequestForwarder) {
        this.roomService = roomService;
        this.gameService = gameService;
        this.ownershipRegistry = ownershipRegistry;
        this.serverId = serverId;
        this.roomRequestForwarder = roomRequestForwarder;
        this.gameRequestForwarder = gameRequestForwarder;
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

            //this.roomService.joinRoom(room.getCode(), player);
            await this.joinRoom(normalizedCode, player);
            room.setHost(player.getId());

            console.log("Player ID :", player.getId());
            console.log("Room ID :", room.getCode());
            console.log("game Created for - ", room.getCode());
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

    async joinRoom(roomCode, player) {

        console.log("entry - Match Coordinator");

        console.log("Incoming roomCode:", JSON.stringify(roomCode));
        console.log("Current serverId:", this.serverId);

        const ownerServerId = await this.ownershipRegistry.getOwner(roomCode)

        console.log("Owner returned by Redis:", ownerServerId);

        if (!ownerServerId) {
            throw new Error("Room does not exist");
        }

        if (ownerServerId === this.serverId) {      // if the owner is the same server join the room locally
            console.log("playerName : ", player.getName());
            console.log("roomCode : ", roomCode)
            const room = this.roomService.joinRoom(roomCode, player);

            console.log("Players in Room  : ", room.getAllPlayersNames());

            const game = this.gameService.getGame(roomCode);


            game.addPlayer(player.getId());

            // console.log(game.)

            //return room;
            return this.getPublicMatchState(roomCode);
        }


        // make a PostCall to the another server to join the room
        const result = await this.roomRequestForwarder.forwardJoin(
            ownerServerId,
            roomCode,
            player.getId(),
            player.getName()
        );
        console.log("Match-coordinator -result : ", result);
        return result.roomInfo;
    }

    async leaveRoom(roomCode, playerId) {
        // Coordinate room removal and game cleanup

        const ownerServerId = await this.ownershipRegistry.getOwner(roomCode);

        if (!ownerServerId) {
            throw new Error("Room Does not Exist");
        }

        if (this.serverId === ownerServerId) {

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

        const result = await this.roomRequestForwarder.forwardLeave(
            ownerServerId,
            roomCode,
            playerId,
        );

        return result;
    }

    getPublicMatchState(roomCode) {
        const room = this.roomService.getRoom(roomCode);
        const game = this.gameService.getGame(roomCode);
        const result = {
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
        }
        console.log("Public Match state :", result);

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

    async startGame(roomCode, playerId) {

        const ownerServerId = await this.ownershipRegistry.getOwner(roomCode);

        if (!ownerServerId) {
            throw new Error("Room does not exist");
        }

        if(ownerServerId === this.serverId){
            const room = this.roomService.getRoom(roomCode);
            console.log("startGame-Match coordinator room code", room.getCode());
        
        if (!room.players.has(playerId)) {
            throw new Error("Player does not belong to this room");
        }

        if (room.hostId !== playerId) {
            throw new Error("Only the host can start the game");
        }

        if (room.players.size < 2) {
            throw new Error("Atleast 2 players are required");
        }

        const gameStart = this.gameService.startGame(roomCode, playerId);
        console.log( "Match coordinator -  game Start:",gameStart);
        return gameStart;
        }
        
        const result = await this.gameRequestForwarder.forwardStart(ownerServerId, roomCode, playerId);
        return result.gameInfo;
        
    }


   async submitGuess(roomCode, playerId, number) {
         console.log("Entry - Match Coordinator submit Guess")

        const ownerServerId = await this.ownershipRegistry.getOwner(roomCode);

        

        if(this.serverId === ownerServerId){
            if (!this.roomService.isPlayerInRoom(roomCode, playerId)) {
            throw new Error("Player is not in room");
        }
            return this.gameService.submitGuess(roomCode, playerId, number);
        }

        const result = await this.gameRequestForwarder.forwardGuess(ownerServerId, roomCode, playerId,number);
        console.log("Exit - Match Coordinator submit Guess")
        return result;
        
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