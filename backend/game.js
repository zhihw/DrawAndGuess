const wordList = ["apple", "banana", "cherry"];

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

function startRound(io, ready) {
  roundNo += 1;
  resetPlayers(ready);
  currentArtistIx = artistPicker(ready);
  currentWord = pickRandomWord();
  const roundEndTs = Date.now() + 120_000;

  io.in("readyRoom").emit("gameStarted", {
    roundNo, artistIx: currentArtistIx, word: currentWord, roundEndTs
  });

  if(roundTimerId) clearTimeout(roundTimerId);
  roundTimerId=setTimeout(() => endRound(io, ready, -1), 120_000);
}

function endRound(io, ready, winnerIx) {
  if (roundTimerId) {
    clearTimeout(roundTimerId);
    roundTimerId=null;
  }
  if (winnerIx>=0){
    ready[winnerIx].score += 1;
    ready[currentArtistIx].score += 1;
  }
  io.in("readyRoom").emit("roundEnded", {
    roundNo, winnerIx, artistIx: currentArtistIx,
    correctWord: currentWord, players: ready
  });
  if (roundNo < MAX_ROUNDS && ready.length >= 2) {
    setTimeout(() => startRound(io, ready), 5_000);
  } else {
    inGame = false;
    io.in("readyRoom").emit("gameFinished", { players: ready });
  }
}

module.exports = { startRound, endRound, checkAnswer };
