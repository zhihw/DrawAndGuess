let inGame = false;

function setInGame(value) {
  inGame = value;
}

function getInGame() {
  return inGame;
}

module.exports = { setInGame, getInGame };
