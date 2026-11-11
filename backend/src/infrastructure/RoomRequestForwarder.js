const ServerDirectory = require("./ServerDirectory");

class RoomRequestForwarder {
    constructor() {
        this.serverDirectory = new ServerDirectory();
    }

    async forwardJoin(ownerServerId, roomCode, playerId, playerName) {

         console.log("forwarded request - Room REquest Forworder");
        if (!roomCode || !playerId || !playerName) {
            throw new Error("Invalid room code, player ID, or player name");
        }

        const baseUrl = this.serverDirectory.getAddress(ownerServerId);
        console.log("baseURL : ", baseUrl);

        const url = `${baseUrl}/internal/rooms/${encodeURIComponent(roomCode)}/join`;
        console.log("URL : ", url)
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                playerId,
                playerName
            })
        });

        if (!response.ok) {
            throw new Error(
                `Failed to forward join request. HTTP status: ${response.status}`
            );
        }
        console.log("forwarded request - success - Room REquest Forworder");
        const result = await response.json();
        console.log("Forward Join - Result: ", result.roomInfo.players[0].name);
        return result;
    }


    async forwardLeave(ownerServerId, roomCode, playerId){
         if (!roomCode || !playerId ) {
            throw new Error("Invalid room code or  player ID");
        }

        const baseUrl = this.serverDirectory.getAddress(ownerServerId);

        const url = `${baseUrl}/internal/rooms/${encodeURIComponent(roomCode)}/leave`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                playerId
            })
        });


        if (!response.ok) {
            throw new Error(
                `Failed to forward leave request. HTTP status: ${response.status}`
            );
        }
        const result = await response.json();

        return result;
    }
}

module.exports = RoomRequestForwarder;