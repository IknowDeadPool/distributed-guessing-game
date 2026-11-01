class RoomOwnershipRegistry {
    constructor(redisClient) {
        this.redis = redisClient;
    }

    async reserveRoom(roomCode, serverId) {
        const result = await this.redis.set(
            `room:${roomCode}:owner`,
            serverId,
            {
                NX: true,
                EX: 300
            }
        );

        return result === "OK";
    }

    async getOwner(roomCode) {
        return await this.redis.get(`room:${roomCode}:owner`);
    }

    // async releaseRoom(roomCode, serverId) {
    //     const owner = await this.getOwner(roomCode);

    //     if(owner === serverId){
    //         await this.redis.del(`room:${roomCode}:owner`)
    //     }
    // }

    async releaseRoom(roomCode, serverId) {
    const key = `room:${roomCode}:owner`;

    const script = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
            return redis.call("DEL", KEYS[1])
        else
            return 0
        end
    `;

    const result = await this.redis.eval(script, {
        keys: [key],
        arguments: [serverId]
    });

    return result === 1;
}
}

module.exports = RoomOwnershipRegistry;