const { placeHolder } = require("./game");
const db = require("./db");
////custom id generater num only with custom length
function idGenerate(l) {
  let id = "";
  for (let i = 0; i < l; i++) {
    id += Math.floor(Math.random() * 10);
  }
  return id;
}

let clients = []; //client
let index = 0;
let waiting = []; //socket.id
let ready = []; //{state,socket.id}
let inGame = false;
function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("new client:", socket.id);
    index++;
    const id = idGenerate(6);
    const nickname = `user${index}`;
    const client = {
      socketID: socket.id,
      nickname: nickname,
      userID: nickname + id,
      score: 0,
    };
    clients.push(client);
    //new client will be added into the clients array

    waiting.push(socket.id);
    io.emit("allPlayers", clients);
    io.emit("lobbyPlayers", waiting);
    socket.emit("yourData", client);
    //players who want to stay in lobby | not ready yet

    db.query(
      `INSERT INTO clients (userID, nickname, score)
             VALUES (?,?,?)`,
      [client.userID, client.nickname, client.score],
      (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            console.log("userID is exist:", client.userID);
          }
        }
      }
    );
    //add user info into db

    /* Home screen events*/
    socket.on("nickname", (nName) => {
      const oldID = client.userID;
      client.nickname = nName;
      client.userID = nName + id;
      console.log(client.nickname);
      db.query(
        `UPDATE clients
             SET nickname = ?, userID = ?
             WHERE userID = ? 
             `,
        [client.nickname, client.userID, oldID]
      );
      socket.emit("yourData", client);
      io.emit("lobbyPlayers", waiting);
      io.emit("allPlayers", clients);
    });
    //closure the client when user connected,  and because it is reference so clients will be edited

    socket.on("start", () => {
      waiting = waiting.filter((c) => c !== socket.id);
      const c = {
        nickname: client.nickname,
        socketID: socket.id,
        agree: false,
      };
      ready.push(c);
      socket.join("readyRoom");
      io.emit("lobbyPlayers", waiting);
    });

    socket.on("sendReady", () => {
      socket.emit("readyPlayers", ready);
    });

    socket.on("historyScore", () => {
      db.query(`SELECT * FROM clients`, (err, playerData) => {
        if (err) {
          console.log("fail", err);
          return;
        }
        playerData.sort((a, b) => b.score - a.score);
        socket.emit("allPlayersData", playerData);
      });
      db.query(
        `SELECT * FROM clients
                 WHERE userID= ?`,
        [client.userID],
        (err, Data) => {
          if (err) {
            console.log("fail", err);
            return;
          }
          socket.emit("yourDbData", Data);
        }
      );
    });
    // readyscreen events
    socket.on("readyReturn", () => {
      ready = ready.filter((c) => c.socketID !== socket.id);
      waiting.push(socket.id);
      socket.leave("readyRoom");
      io.emit("lobbyPlayers", waiting);
      io.emit("readyPlayers", ready);
      if (ready.length >= 2 && ready.every((player) => player.agree === true)) {
        inGame = true;
        io.emit("startGame", { timestamp: Date.now(), gameState: inGame });
      }
    });

    socket.on("ready", () => {
      const player = ready.find((c) => c.socketID === socket.id);
      if (player && !player.agree) {
        player.agree = true;
      }
      if (ready.length >= 2 && ready.every((player) => player.agree === true)) {
        inGame = true;
        io.emit("startGame", { timestamp: Date.now(), gameState: inGame });
      } else {
        io.in("readyRoom").emit("readyPlayers", ready);
      }
    });
    // gamescreen events
    socket.on("getPoints", (points) => {
      client.score += points;
    });

    //scorescreen events
    socket.on("playerScore", () => {
      const playerScores = clients
        .filter((c) => ready.some((r) => r.socketID === c.socketID))
        .map((c) => ({ userID: c.userID, score: c.score }));
      io.in("readyRoom").emit("playerScore", playerScores);
    });

    socket.on("disconnect", () => {
      socket.removeAllListeners();
      clients = clients.filter((c) => c.socketID !== socket.id);
      waiting = waiting.filter((id) => id !== socket.id);
      ready = ready.filter((c) => c.socketID !== socket.id);
      io.emit("lobbyPlayers", waiting);
      io.emit("readyPlayers", ready);
      io.emit("allPlayers", clients);
      //remove current user

      db.query(
        `DELETE FROM clients WHERE userID = ? AND score = 0`,
        [client.userID],
        (err, result) => {
          if (err) {
            console.error("fail:", err);
          } else if (result.affectedRows > 0) {
            console.log(`delete invalid user form db ${client.userID}`);
          }
        }
      );
      //avoid db include invalid data
    });
    //todo chat event, canvas event,disconnect...
  });
}

module.exports = { setupSocket };
