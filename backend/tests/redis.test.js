const redisClient = require("../src/infrastructure/redisClient");
const RoomOwnershipRegistry = require("../src/infrastructure/RoomOwnershipRegistry");

async function test() {
    try {
        await redisClient.connect();

        const registry = new RoomOwnershipRegistry(redisClient);

        // const first = await registry.reserveRoom("TEST01", "server-A");
        // console.log("First reservation:", first);

        // const second = await registry.reserveRoom("TEST01", "server-B");
        // console.log("Second reservation:", second);

        // const owner = await registry.getOwner("TEST01");
        // console.log("Room owner:", owner);


        await registry.reserveRoom("TEST02", "server-A");

        console.log(
            "Wrong owner release:",
            await registry.releaseRoom("TEST02", "server-B")
        );

        console.log(
            "Owner after wrong release:",
            await registry.getOwner("TEST02")
        );

        console.log(
            "Correct owner release:",
            await registry.releaseRoom("TEST02", "server-A")
        );

        console.log(
            "Owner after correct release:",
            await registry.getOwner("TEST02")
        );

    } catch (error) {
        console.error(error);
    } finally {
        await redisClient.quit();
    }
}

test();