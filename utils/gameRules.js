// Safe zones (stars + colored start positions)
const SAFE_ZONES = [0, 8, 13, 21, 26, 34, 39, 47]; 
exports.SAFE_ZONES = SAFE_ZONES;  

// Check if move is valid
exports.checkMove = (token, diceValue) => {
  if (token.position === -1 && diceValue !== 6) return false; // Need 6 to start
  if (token.position + diceValue > 57) return false; // Can't go beyond home
  return true;
};

// Apply move
exports.applyMove = (token, diceValue) => {
  if (token.position === -1 && diceValue === 6) {
    token.position = 0; // Start position
  } else {
    token.position += diceValue;
  }
  if (token.position === 57) {
    token.position = 100; // Reached home
  }
  return token;
};

// Check cutting (send opponent back if landed on same spot and not safe zone)
exports.handleCutting = (game, currentPlayerId, newPos) => {
  let cut = false;
  game.players.forEach((p) => {
    if (p.userId.toString() !== currentPlayerId) {
      p.tokens.forEach((t) => {
        if (t.position === newPos && !SAFE_ZONES.includes(newPos)) {
          t.position = -1; // send back home
          cut = true;
        }
      });
    }
  });
  return cut;
};

// Winner check
exports.checkWinner = (tokens) => {
  return tokens.every((t) => t.position === 100);
};
