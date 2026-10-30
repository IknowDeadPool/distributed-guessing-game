const pino = require("pino");

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    base: {
        service: "guessing-game",
        instanceId: process.env.INSTANCE_ID || "local"
    },
    timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = logger;