class Room {
    constructor(code, roomSize) {
        this.code = code;
        this.players = new Map();
        this.hostId = null;
        this.roomSize = roomSize;
        this.status = "OPEN"
    }

    getCode() {
        return this.code;
    }

    addPlayer(player) {
        
        if (this.isRoomFull()) {
            throw new Error("Room is Full");
        }

        if (this.players.has(player.getId())) throw new Error("Player already in Room");

        this.players.set(player.getId(), player);

        this.updateRoomStatus();
    }

    updateRoomStatus(){
        if(this.players.size === this.roomSize){
            this.setStatus("CLOSED");
        }
        else if(this.players.size < this.roomSize){
            this.setStatus("OPEN")
        }
    }

    isRoomFull() {
        
        return this.players.size >= this.roomSize;
    }
    removePlayer(playerId) {
        if (!this.players.has(playerId)) {
            throw new Error("Player doesn't exist in the room");
        }

        const player = this.players.get(playerId);
        const wasHost = this.hostId === playerId;

        this.players.delete(playerId);
        player.disconnect();

        if (wasHost) {
            this.hostId = null;

            const nextPlayer = this.getNextAvailablePlayer();

            if (nextPlayer) {
                this.setHost(nextPlayer.getId());
            }
        }
        this.updateRoomStatus();
    }

    setHost(playerId) {
        const newHost = this.players.get(playerId);

        if (!newHost) {
            throw new Error("Player doesn't exist in the room");
        }

        if (this.hostId && this.players.has(this.hostId)) {
            const oldHost = this.players.get(this.hostId);
            oldHost.changeHosting(false);
        }

        this.hostId = playerId;
        newHost.changeHosting(true);
    }

    setStatus(status) {
        if (status !== "OPEN" && status !== "CLOSED") {
            throw new Error("Invalid room status");
        }
        this.status = status;
    }

    getRoomInfo() {
        const players = Array.from(this.players.values()).map((player) => {
            return player.getPlayerInfo();
        });

        return { roomCode: this.code, players: players, host: this.hostId, status: this.status }
    }

    getNextAvailablePlayer() {
        for (const player of this.players.values()) {
            if (player.isConnected()) {
                return player;
            }
        }
        return null;
    }

    getHostId() {
        return this.hostId;
    }

}

module.exports = Room;