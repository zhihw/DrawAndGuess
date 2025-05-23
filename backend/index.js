const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { setupSocket } = require("./socket");

const app = express();
app.use(cors()); // 允许跨域

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// 把 Socket 逻辑挂载进来
setupSocket(io);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 后端启动，监听端口 ${PORT}`);
});