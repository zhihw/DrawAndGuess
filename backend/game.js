const pool = require("./db");
const { setInGame, getInGame } = require("./socket");
const wordList = [
  "apple",
  "banana",
  "cherry",
  "pizza",
  "burger",
  "cake",
  "cookie",
  "sandwich",
  "fries",
  "sushi",
  "donut",
  "icecream",
  "dog",
  "cat",
  "rabbit",
  "lion",
  "tiger",
  "elephant",
  "giraffe",
  "dolphin",
  "penguin",
  "koala",
  "panda",
  "phone",
  "camera",
  "laptop",
  "book",
  "clock",
  "chair",
  "table",
  "bed",
  "umbrella",
  "toothbrush",
  "glasses",
  "key",
  "car",
  "bus",
  "bicycle",
  "train",
  "airplane",
  "boat",
  "rocket",
  "sun",
  "moon",
  "star",
  "cloud",
  "rainbow",
  "mountain",
  "river",
  "tree",
  "flower",
  "snowman",
  "fire",
  "leaf",
  "robot",
  "wizard",
  "dragon",
  "ghost",
];

function artistPicker(playerList) {
  const random = Math.floor(Math.random() * playerList.length);
  playerList[random].role = "Artist";
  return random;
}

function resetPlayers(playerList) {
  playerList.forEach((player) => {
    player.role = "Guess";
  });
}

function pickRandomWord() {
  const i = Math.floor(Math.random() * wordList.length);
  return wordList[i];
}

let roundNo = 0;
const MAX_ROUNDS = 5;
let currentWord = "";
let currentArtistIx = -1;
let inGame = false;
let roundTimerId = null;

function checkAnswer(answer) {
  if (currentWord === answer.toLowerCase()) {
    return true;
  }
  return false;
}

function startGame(io, ready) {
  roundNo = 0;
  startRound(io, ready);
}

function startRound(io, ready) {
  roundNo += 1;
  resetPlayers(ready);
  currentArtistIx = artistPicker(ready);
  currentWord = pickRandomWord();
  const roundEndTs = Date.now() + 120_000;

  io.in("readyRoom").emit("gameStarted", {
    roundNo,
    artistIx: currentArtistIx,
    word: currentWord,
    roundEndTs,
    players: ready,
  });
  if (roundTimerId) clearTimeout(roundTimerId);
  roundTimerId = setTimeout(() => endRound(io, ready, -1), 120_000);
}

async function endRound(io, ready, winnerIx) {
  if (roundTimerId) {
    clearTimeout(roundTimerId);
    roundTimerId = null;
  }
  if (winnerIx >= 0) {
    ready[winnerIx].score += 1;
    ready[currentArtistIx].score += 1;
  }
  io.in("readyRoom").emit("roundEnded", {
    roundNo,
    winnerIx,
    artistIx: currentArtistIx,
    correctWord: currentWord,
    players: ready,
  });
  if (roundNo < MAX_ROUNDS && ready.length >= 2) {
    setTimeout(() => {
      startRound(io, ready);
      io.in("readyRoom").emit("clearCanvas");
    }, 5_000);
    return;
  }

  try {
    const ids = ready.map((p) => p.userID);
    if (ids.length) {
      const cases = ready.map(() => "WHEN ? THEN ?").join(" ");
      const sql = `
        UPDATE clients
        SET score = score + CASE userID ${cases} END
        WHERE userID IN (${ids.map(() => "?").join(",")})
      `;
      const params = ready.flatMap((p) => [p.userID, p.score]).concat(ids);
      await pool.promise().query(sql, params);
    }
  } catch (err) {
    console.error("fail", err);
  }

  roundNo = 0;
  currentArtistIx = -1;
  io.in("readyRoom").emit("gameFinished", { players: ready });
  io.in("readyRoom").socketsLeave("readyRoom");
  ready.length = 0;
  io.emit("finishGame", { gameState: false });
  setInGame(false);
  return;
}
module.exports = { startGame, startRound, endRound, checkAnswer };
