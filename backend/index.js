const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { setupSocket } = require("./socket");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

setupSocket(io);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Listening ${PORT}`);
});