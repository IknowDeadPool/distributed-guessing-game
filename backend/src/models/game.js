//const e = require("cors");
const crypto = require("crypto");
require('dotenv').config();

class Game {
    constructor(roomCode) {
        this.gameCode = crypto.randomUUID();
        this.currentNumber = Math.floor(Math.random() * 100) + 1;
        this.roomCode = roomCode;
        this.state = "WAITING";
        this.roundNumber = 0;
        this.PlayerGuesses = new Map();
        this.winnerId = null;
        this.startTime_Round = null;
        this.endTime_Round = null;
        this.PlayerLastGuessed = new Map();
        this.duration = process.env.ROUND_DURATION;
        this.coolDown = process.env.COOL_DOWN;
        this.playerScores = new Map();
    }

    getCode() {
        return this.gameCode;
    }
    startRound() {


        if (this.state === "IN_PROGRESS") throw new Error("Game is already running");

        if (this.roundNumber >= 3) {
            this.playerScores.clear();
            throw new Error("All rounds completed");
        }
        this.resetRound();

        this.nextNumber();
        this.winnerId = null;
        this.startTime_Round = Date.now()
        this.endTime_Round = this.startTime_Round + Number(this.duration);
        this.roundNumber++;
        this.state = "IN_PROGRESS";
    }

    guessedNumber(number) {
        if (!Number.isInteger(number)) throw new Error("invalid number");

        if (number < 1 || number > 100) throw new Error("number out of range");

        if (number === this.currentNumber) return "CORRECT";
        else if (number < this.currentNumber) return "HIGHER"
        else if (number > this.currentNumber) return "LOWER";
    }

    nextNumber() {
        let number = Math.floor(Math.random() * 100) + 1;

        this.currentNumber = number;
    }

    resetRound() {
        this.PlayerLastGuessed.clear();
        this.PlayerGuesses.clear();
    }

    setState(state) {
        const validStates = ["WAITING", "IN_PROGRESS", "FINISHED"];

        if (!validStates.includes(state)) {
            throw new Error("Invalid game state");
        }
        this.state = state;
    }

    submitGuess(playerId, number) {

        const now = Date.now();

        if (this.state !== "IN_PROGRESS") throw new Error("Game is not in progress");

        if (now > this.endTime_Round) throw new Error("Time Elapsed");


        if (now - this.PlayerLastGuessed.get(playerId) < this.coolDown) throw new Error("Wait 2 seconds before guessing again");

        const guessedState = this.guessedNumber(number);
        this.PlayerLastGuessed.set(playerId, now);



        return {
            result: guessedState,
        }

    }

    /* Finish the round */

    finishRound(winnerId = null, reason = "TIMEOUT") {
    if (this.state !== "IN_PROGRESS") {
        throw new Error("Round is not active");
    }

    this.winnerId = winnerId;
    this.PlayerLastGuessed.clear();
    this.startTime_Round = null;
    this.endTime_Round = null;
    this.state = "FINISHED";

    let score = null;

    if (reason === "CORRECT") {
        if (winnerId === null) {
            throw new Error("Correct guess requires a winner");
        }

        score = (this.playerScores.get(winnerId) ?? 0) + 10;
        this.playerScores.set(winnerId, score);
    }

    return {
        winnerId,
        round: this.roundNumber,
        answer: this.currentNumber,
        result: reason,
        score
    };
}

    getState() {
        return this.state;
    }
}



module.exports = Game;