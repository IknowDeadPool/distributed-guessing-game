const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is healthy"
    });
});

// REST API routes will go here later
// app.use("/api/rooms", roomRoutes);

module.exports = app;


// room // player // game //