const { startGame, startRound, endRound, checkAnswer } = require("./game");
const db = require("./db");
const { setInGame, getInGame } = require("./gameState");
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
let ready = []; //{state,socket.id}

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

    io.emit("allPlayers", clients);
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
      io.emit("allPlayers", clients);
    });
    //closure the client when user connected,  and because it is reference so clients will be edited

    socket.on("requestInit", () => {
      socket.emit("yourData", client);
      socket.emit("allPlayers", clients);
    });

    socket.on("start", () => {
      const c = {
        nickname: client.nickname,
        userID: client.userID,
        socketID: socket.id,
        agree: false,
        role: "Guess",
        score: 0,
      };
      ready.push(c);
      socket.join("readyRoom");
      io.emit("readyPlayers", ready);
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
      socket.leave("readyRoom");
      io.emit("readyPlayers", ready);
      //if left player allready ready
      if (ready.length >= 2 && ready.every((player) => player.agree === true)) {
        io.emit("startGame", { timestamp: Date.now(), gameState: true });
        setInGame(true);
        startRound(io, ready);
      }
    });

    socket.on("checkGameState", () => {
      socket.emit("gameState", { gameState: getInGame() });
    });

    socket.on("ready", () => {
      const player = ready.find((c) => c.socketID === socket.id);
      if (player && !player.agree) {
        player.agree = true;
      }
      if (ready.length >= 2 && ready.every((player) => player.agree === true)) {
        io.emit("startGame", { timestamp: Date.now(), gameState: true });
        setInGame(true);
        startGame(io, ready);
      } else {
        io.in("readyRoom").emit("readyPlayers", ready);
      }
    });

    //game screen events

    socket.on("submitGuess", ({ guessWord }) => {
      const playerIdx = ready.findIndex((p) => p.socketID === socket.id);
      if (playerIdx === -1) return;
      if (checkAnswer(guessWord)) {
        endRound(io, ready, playerIdx);
      } else socket.emit("wrongAnswer");
    });

    socket.on("chat", (msgpkg) => {
      player = ready.find((c) => c.socketID === socket.id);
      io.in("readyRoom").emit("chat", msgpkg);
    });

    socket.on("draw", (data) => {
      socket.to("readyRoom").emit("draw", data);
    });

    socket.on("clearCanvas", () => {
      socket.to("readyRoom").emit("clearCanvas");
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
      ready = ready.filter((c) => c.socketID !== socket.id);
      if (ready.length < 2) {
        endRound(io, ready, -1);
        setInGame(false);
      }
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
  });
}

module.exports = { setupSocket };
