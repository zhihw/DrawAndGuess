const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { setupSocket } = require("./socket");

const app = express();

const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    credentials: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setupSocket(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Listening ${PORT}`);
});
