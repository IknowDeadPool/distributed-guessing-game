const Room = require('../models/room');
const crypto = require("crypto");
class RoomManagement {
    constructor() {
        this.Rooms = new Map();
        this.playerRooms = new Map(); // playerId -> roomCode
    }

    createRoom(roomSize) {
        //if(hostId == null) throw new Error("Host id needs to be valid");
        if (roomSize < 2 || roomSize > 10) throw new Error("Players can only be betwee 2 and 10");

        let room;
        let roomCode;

        do {
            roomCode = crypto.randomBytes(3)
                .toString("hex")
                .toUpperCase();
        } while (this.Rooms.has(roomCode));

        try {
            room = new Room(roomCode, roomSize);
            //room.setHost(hostId);
            this.Rooms.set(roomCode, room);
        }
        catch (error) {
            return {
                status: "failed",
                message: error
            };
        }
        return room;
    }

    getRoom(roomCode) {
        if (roomCode === null) {
            throw new Error("Room Code is required");
        }
        if (!this.Rooms.has(roomCode)) {
            throw new Error("Room Doesnt Exist");
        }

        const room = this.Rooms.get(roomCode);

        return room;
    }

    joinRoom(roomCode, player) {
        if (roomCode === null || !this.Rooms.has(roomCode)) throw new Error("Room code should be valid");

        if(this.playerRooms.has(player.getId())) throw new Error("Player already in another room");

        const room = this.Rooms.get(roomCode);

        room.addPlayer(player);
        
        
        this.playerRooms.set(player.getId(), roomCode);

        return room;
    }

    leaveRoom(roomCode, playerId) {
        if (roomCode === null || !this.Rooms.has(roomCode)) throw new Error("Room code should be valid");
        
        console.log("leaveing room - RoomManagement");
        const room = this.Rooms.get(roomCode);

        room.removePlayer(playerId);

        this.playerRooms.delete(playerId);

        if(room.players.size === 0){
            this.Rooms.delete(roomCode);
            return null;
        }
        console.log("left room - RoomManagement");
        return room;
    }

    changeHost(roomCode, hostId) {
        const room = this.Rooms.get(roomCode);
        room.setHost(hostId);
    }

    isPlayerInRoom(roomCode, playerId){
        if(this.playerRooms.has(playerId) && this.playerRooms.get(playerId) === roomCode) return true;
        return false;
    }

    getRoomInfo(roomCode){
        return this.Rooms.get(roomCode).getRoomInfo();
    }
    
}

module.exports = RoomManagement;