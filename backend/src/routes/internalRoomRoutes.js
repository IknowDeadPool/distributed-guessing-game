const express = require("express");
const Player = require("./../models/player");

function createInternalRoomRoutes(matchCoordinator) {
    const router = express.Router();

    router.post("/rooms/:roomCode/join", async (req, res) => {
        console.log(" entry - internal room Routes")
        try {

            const { roomCode } = req.params;
            const { playerId, playerName } = req.body;


            if (!playerId || !playerName) {
                return res.status(400).json({
                    message: "playerId and playerName are required"
                });
            }

            const normalizedCode = roomCode
                .trim()
                .toUpperCase();
            const player = new Player(playerId, playerName);

            const updatedRoom = await matchCoordinator.joinRoom(normalizedCode, player);

            return res.status(200).json({
                message: "Player joined room successfully",
                roomInfo: matchCoordinator.getPublicMatchState(normalizedCode)
            });
        } catch (error) {
            return res.status(500).json({
                message: "Error occurred while joining room",
                error: error.message
            });
        }
    });

    return router;
}

module.exports = createInternalRoomRoutes;