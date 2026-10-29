require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const server = http.createServer(app);

const RoomManagement = require("./services/RoomManagement");
const registerRoomHandlers = require("./handlers/roomHandler");
const registerGameHandlers = require("./handlers/gameHandler");
const GameManagement = require("./services/GameManagement");

const roomService = new RoomManagement();
const gameService = new GameManagement(roomService);

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

    registerRoomHandlers(io, socket,roomService, gameService);
    registerGameHandlers(io, socket, gameService);

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});