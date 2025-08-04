// ✅ server/utils/diceRoller.js
let winningPlayerId = null;

function setWinningPlayer(playerId) {
  winningPlayerId = playerId;
}

function getWinningPlayer() {
  return winningPlayerId;
}

function rollDice(playerId) {
  if (playerId === winningPlayerId) {
    const weightedDice = [4, 5, 6, 4, 5, 6, 1, 2, 3];
    return weightedDice[Math.floor(Math.random() * weightedDice.length)];
  } else {
    return Math.floor(Math.random() * 6) + 1;
  }
}

module.exports = {
  rollDice,
  setWinningPlayer,
  getWinningPlayer,
};
