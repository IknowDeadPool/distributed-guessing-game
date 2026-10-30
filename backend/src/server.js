require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const server = http.createServer(app);

const RoomManagement = require("./services/RoomManagement");
const registerRoomHandlers = require("./handlers/roomHandler");
const registerGameHandlers = require("./handlers/gameHandler");
const GameManagement = require("./services/GameManagement");
const MatchCoordinator = require("./application/MatchCoordinator");

const roomService = new RoomManagement();
const gameService = new GameManagement();
const matchCoordinator = new MatchCoordinator(roomService, gameService);

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
    registerGameHandlers(io, socket,matchCoordinator);

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
    });
});



// io.on("connection", (socket) => {
//     console.log("[1] Socket connected:", socket.id);

//     socket.onAny((event, ...args) => {
//         console.log("[EVENT RECEIVED]", event, args);
//     });

//     try {
//         registerRoomHandlers(io, socket, matchCoordinator);
//         console.log("[2] Room handlers registered");
//     } catch (error) {
//         console.error("[REGISTRATION ERROR]", error.stack);
//     }

//     socket.on("disconnect", (reason) => {
//         console.log("[DISCONNECTED]", socket.id, reason);
//     });
// });

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});