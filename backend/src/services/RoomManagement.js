const Room = require('../models/room');
const crypto = require("crypto");
class RoomManagement {
    constructor() {
        this.Rooms = new Map();
        this.playerRooms = new Map(); // playerId -> roomCode
    }

    createRoom(roomCode = null,roomSize) {
        //if(hostId == null) throw new Error("Host id needs to be valid");
        if (roomSize < 2 || roomSize > 10) throw new Error("Players can only be betwee 2 and 10");

        if (!roomCode) {
            do {
                roomCode = crypto.randomBytes(3)
                    .toString("hex")
                    .toUpperCase();
            } while (this.Rooms.has(roomCode));
        }

        if (this.Rooms.has(roomCode)) {
            throw new Error("Room code already exists locally");
        }
        const room = new Room(roomCode, roomSize);
        this.Rooms.set(roomCode, room);
        return room;
    }

    getRoom(roomCode) {
        console.log("Looking for room:", roomCode);
    console.log("Rooms stored on this server:", [...this.Rooms.keys()]);
    
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

        console.log("join ROom - Room Management");

        console.log("player Name : ", player.getName());
        
        if (roomCode === null || !this.Rooms.has(roomCode)) throw new Error("Room code should be valid");

        if (this.playerRooms.has(player.getId())) throw new Error("Player already in another room");

        const room = this.getRoom(roomCode);

        room.addPlayer(player);


        this.playerRooms.set(player.getId(), roomCode);
        console.log("join Room Successful - Room Management");
        return room;
    }

    leaveRoom(roomCode, playerId) {
        if (roomCode === null || !this.Rooms.has(roomCode)) throw new Error("Room code should be valid");

        console.log("leaveing room - RoomManagement");
        const room = this.Rooms.get(roomCode);

        room.removePlayer(playerId);

        this.playerRooms.delete(playerId);

        if (room.players.size === 0) {
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

    isPlayerInRoom(roomCode, playerId) {
        if (this.playerRooms.has(playerId) && this.playerRooms.get(playerId) === roomCode) return true;
        return false;
    }

    getRoomInfo(roomCode) {
        return this.Rooms.get(roomCode).getRoomInfo();
    }

}

module.exports = RoomManagement;