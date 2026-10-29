class MatchCoordinator {
    constructor(roomService, gameService) {
        this.roomService = roomService;
        this.gameService = gameService;
    }

    leaveRoom(roomCode, playerId) {
        // Coordinate room removal and game cleanup
        // const room = this.roomService.getRoom(roomCode);
        // const game = this.gameService.getGame(roomCode);

        const updatedRoom = this.roomService.leaveRoom(roomCode, playerId);
        if (updatedRoom === null) {
            this.gameService.removeGame(roomCode);

            return {
                roomDeleted: true,
                roomCode
            };
        }

        this.gameService.handlePlayerLeft(roomCode);

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

    // joinRoom(playerId,playerName){

    // }
}

module.exports = MatchCoordinator;