class ServerHeartbeatController{
    constructor(redisClient){
        this.redisClient = redisClient;
    }

    async setServerState(serverId){
         const result = await this.redisClient.set(
            `server:${serverId}:alive`,
            "true",
            {
                EX: 5 // Expiry after 5 seconds
            }
        );

        return result === "OK";
    }
    async isServerAlive(serverId){
        const key = `server:${serverId}:alive`;

        const result = await this.redisClient.exists(key);

        return result === 1;
    }
}



module.exports = ServerHeartbeatController;