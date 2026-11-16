require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const redisClient = require("./infrastructure/redisClient");
const { createAdapter } = require("@socket.io/redis-adapter");
const { pubClient, subClient } = require("./infrastructure/redisAdapterClient");
const ServerHeartbeatController = require("./infrastructure/ServerHeartbeatController");
const ServerDirectory = require("./infrastructure/ServerDirectory");
const RoomOwnershipRegistry = require("./infrastructure/RoomOwnershipRegistry");
const server = http.createServer(app);
const SERVER_ID = process.env.SERVER_ID || "server-A";
const serverDirectory = new ServerDirectory();

const ownershipRegistry = new RoomOwnershipRegistry(redisClient);


const RoomManagement = require("./services/RoomManagement");
const registerRoomHandlers = require("./handlers/roomHandler");
const registerGameHandlers = require("./handlers/gameHandler");
const GameManagement = require("./services/GameManagement");
const MatchCoordinator = require("./application/MatchCoordinator");
const createInternalRoomRoutes = require("./routes/internalRoomRoutes");
const createInternalGameRoutes = require("./routes/internalGameRoutes");

const RoomRequestForwarder = require("./infrastructure/RoomRequestForwarder");
const GameRequestForwarder = require("./infrastructure/GameRequestForwarder");
const roomService = new RoomManagement();
const gameService = new GameManagement();
const roomRequestForwarder = new RoomRequestForwarder();
const gameRequestForwarder = new GameRequestForwarder();

const matchCoordinator = new MatchCoordinator(roomService, gameService, ownershipRegistry, SERVER_ID, roomRequestForwarder, gameRequestForwarder);


// const internalRouter = express.Router();
// internalRouter.use(createInternalRoomRoutes(matchCoordinator));
// internalRouter.use(createInternalGameRoutes(matchCoordinator));

//app.use("/internal", internalRouter);

app.use(
    "/internal",
    createInternalRoomRoutes(matchCoordinator),

);

app.use(
    "/internal",
    createInternalGameRoutes(matchCoordinator),

);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

gameService.on("roundFinished", (data) => {
    io.to(data.roomCode).emit("game:ended", data);
});

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    registerRoomHandlers(io, socket, matchCoordinator);
    registerGameHandlers(io, socket, matchCoordinator);

    socket.on("disconnect", async () => {
        console.log("Player disconnected:", socket.id);
        const { roomCode, playerId } = socket.data;

        if (!roomCode || !playerId) return;

        // Remove player from the match
        await matchCoordinator.leaveRoom(roomCode, playerId);

    });
});




async function startServer() {
    try {
        //await redisClient.connect();

        await Promise.all([
            redisClient.connect(),
            pubClient.connect(),
            subClient.connect()
        ]);

        console.log("Connected to Redis");

        monitorServers();

        io.adapter(createAdapter(pubClient, subClient));

        const PORT = Number(process.env.PORT) || 3001;

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exitCode = 1;
    }
}

async function monitorServers() {
    const heartbeatController = new ServerHeartbeatController(redisClient);

    await heartbeatController.setServerState(SERVER_ID);


    // send alive state to redis every 2s.
    try {
        setInterval(async () => {
            await heartbeatController.setServerState(SERVER_ID);
        }, 2000);
    }

    catch (error) {
        console.error("Failed to publish heartbeat:", error.message);
    }


    // Keep track of who is currently alive so we don't spam logs
    const serverHealthState = new Map();

    try {
        setInterval(async () => {
            const allServers = serverDirectory.getAllServerIds();

            for (const otherServerId of allServers) {  // NOTE: For >100 servers, replace this loop with Redis MGET batching.
                // Don't check ourselves
                if (otherServerId === SERVER_ID) continue;

                const isAlive = await heartbeatController.isServerAlive(otherServerId);
                const wasAlive = serverHealthState.get(otherServerId) ?? true; // assume alive initially

                if (!isAlive && wasAlive) {
                    console.warn(`ALERT: Server ${otherServerId} is DEAD!`);
                    serverHealthState.set(otherServerId, false);
                } else if (isAlive && !wasAlive) {
                    console.log(`Server ${otherServerId} is BACK ONLINE.`);
                    serverHealthState.set(otherServerId, true);
                }
            }
        }, 3000);
    }
    catch (error) {
        console.error("Server health check failed:", error.message);
    }
}

process.on("SIGINT", async () => {   // When pressed ctrl + c
    console.log(`\nShutting down ${SERVER_ID}, removing heartbeat...`);
    await redisClient.del(`server:${SERVER_ID}:alive`);
    server.close(() => {
        process.exit(0);
    });
});




startServer();