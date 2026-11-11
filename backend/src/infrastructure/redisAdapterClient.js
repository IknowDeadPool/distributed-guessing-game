const { createClient } = require("redis");

const url = process.env.REDIS_URL || "redis://localhost:6379";

const pubClient = createClient({ url });
const subClient = pubClient.duplicate();

pubClient.on("error", (e) => console.error("Redis pub error:", e));
subClient.on("error", (e) => console.error("Redis sub error:", e));

module.exports = { pubClient, subClient };