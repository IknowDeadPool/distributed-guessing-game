class Player{
    constructor(id, name){
        this.id = id;
        this.name = name;
       
        this.connected = true;
        this.isHost = false;
        this.isWinner = false;
    }

    // setWinner(isWinner){
    //     this.isWinner = isWinner;
    // }

    changeHosting(isHost){
        this.isHost = isHost;
    }

    isConnected(){
        return this.connected;
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
        return {id : this.id, name : this.name, status : this.connected, isWinner : this.isWinner}
    }
    //set
}

module.exports = Player;