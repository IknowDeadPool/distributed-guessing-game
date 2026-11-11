const express = require("express");

function createInternalGameRoutes(matchCoordinator) {
    const router = express.Router();

    router.post("/game/:roomCode/start", async (req, res) => {
        console.log(" entry - internal game Routes")
        try {

            const { roomCode } = req.params;
            const { playerId } = req.body;

            if (!playerId) {
                return res.status(400).json({
                    message: "player Id required"
                });
            }

            const normalizedCode = roomCode
                .trim()
                .toUpperCase();
        
            const result = await matchCoordinator.startGame(normalizedCode, playerId);
            //console.log("",result)
            return res.status(200).json({
                message: "Player started game successfully",
                gameInfo: result
            });
        } catch (error) {
            return res.status(500).json({
                message: "Error occurred while starting game",
                error: error.message
            });
        }
    });

    router.post("/game/:roomCode/guess", async(req, res)=>{
        try {

            const { roomCode } = req.params;
            const { playerId } = req.body;
            const{number} = req.body;

            if (!playerId ) {
                return res.status(400).json({
                    message: "playerId is required"
                });
            }

            const normalizedCode = roomCode
                .trim()
                .toUpperCase();
            

            const result = await matchCoordinator.submitGuess(normalizedCode, playerId, number);

            return res.status(200).json({
                message: "Player guess submitted successfully",
                ...result
            });
        } catch (error) {
            return res.status(500).json({
                message: "Error occurred while submitting the guess",
                error: error.message
            });
        }
    })

    return router;
}

module.exports = createInternalGameRoutes;
