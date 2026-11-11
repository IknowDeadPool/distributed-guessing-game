const ServerDirectory = require("./ServerDirectory");

class GameRequestForwarder {
    constructor() {
        this.serverDirectory = new ServerDirectory();
    }

    async forwardStart(ownerServerId, roomCode, playerId) {

         console.log("forwarded request - Game REquest Forwarder");
        if (!roomCode || !playerId ) {
            throw new Error("Invalid room code or player ID");
        }

        const baseUrl = this.serverDirectory.getAddress(ownerServerId);
        console.log("baseURL : ", baseUrl);

        const url = `${baseUrl}/internal/game/${encodeURIComponent(roomCode)}/start`;

        console.log("URL : ", url)

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                playerId,
            })
        });

        if (!response.ok) {
            throw new Error(
                `Failed to forward start request. HTTP status: ${response.status}`
            );
        }
        console.log("forwarded request - success - game REquest Forworder");
        const result = await response.json();
        //console.log("Forward start - Result: ", result.roomInfo.players[0].name);
        return result;
    }


    async forwardGuess(ownerServerId, roomCode, playerId, number){
         if (!roomCode || !playerId ) {
            throw new Error("Invalid room code or  player ID");
        }

        const baseUrl = this.serverDirectory.getAddress(ownerServerId);

        const url = `${baseUrl}/internal/game/${encodeURIComponent(roomCode)}/guess`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                playerId,
                number
            })
        });


        if (!response.ok) {
            throw new Error(
                `Failed to forward guess request. HTTP status: ${response.status}`
            );
        }
        const result = await response.json();

        return result;
    }
}

module.exports = GameRequestForwarder;