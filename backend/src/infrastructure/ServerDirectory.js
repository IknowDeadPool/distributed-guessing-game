class ServerDirectory {
    constructor() {
        this.servers = new Map([
            ["server-A", "http://localhost:3001"],
            ["server-B", "http://localhost:3002"]
        ]);
    }

    getAddress(serverId) {
        // Implement this
        if(!this.servers.has(serverId)){

            throw new Error(`Server ID ${serverId} not found in the directory.`);
        }
        return this.servers.get(serverId);
    }
}

module.exports = ServerDirectory;