require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const redisClient = require("./infrastructure/redisClient");
const { createAdapter } = require("@socket.io/redis-adapter");
const { pubClient, subClient } = require("./infrastructure/redisAdapterClient");

const RoomOwnershipRegistry = require("./infrastructure/RoomOwnershipRegistry");
const server = http.createServer(app);
const SERVER_ID = process.env.SERVER_ID || "server-A";
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

const matchCoordinator = new MatchCoordinator(roomService, gameService, ownershipRegistry, SERVER_ID, roomRequestForwarder,gameRequestForwarder);


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

startServer();