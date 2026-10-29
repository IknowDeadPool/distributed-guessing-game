class Player{
    constructor(id, name){
        this.id = id;
        this.name = name;
        this.score = 0;
        this.connected = true;
        this.isHost = false;
        this.isWinner = false;
    }

    setWinner(isWinner){
        this.isWinner = isWinner;
    }

    changeHosting(isHost){
        this.isHost = isHost;
    }

    isConnected(){
        return this.connected;
    }

    addScore(score){
        this.score += score;
    }
    getId(){
        return this.id;
    }
    disconnect(){
        this.id = null;
        this.name = null;
        this.connected = false;
    }
    getPlayerInfo(){
        return {id : this.id, score : this.score, name : this.name, status : this.connected, isWinner : this.isWinner}
    }
    //set
}

module.exports = Player;