const GamePlay = require("../models/GamePlay");
const { setWinningPlayer } = require("../utils/diceRoller");


// Set winner preference
const setWinner = (req, res) => {
  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ message: "Player ID required" });

  setWinningPlayer(playerId);
  return res.status(200).json({ message: `Player ${playerId} set as winner.` });
};

// Boost a player's score
const boostPlayer = async (req, res) => {
  const { gameId, playerId, boostBy } = req.body;

  const game = await GamePlay.findById(gameId);
  if (!game) return res.status(404).json({ message: "Game not found" });

  const player = game.players.find(p => p.userId.toString() === playerId);
  if (!player) return res.status(404).json({ message: "Player not found" });

  player.score += boostBy;
  await game.save();

  res.status(200).json({ message: `Boosted ${player.username} by ${boostBy} points.` });
};

const forceDice = async (req, res) => {
  const { gameId, playerId, diceValue } = req.body;

  const game = await GamePlay.findById(gameId);
  if (!game) return res.status(404).json({ message: "Game not found" });

  if (![1, 2, 3, 4, 5, 6].includes(diceValue))
    return res.status(400).json({ message: "Invalid dice value" });

  //  Proper Map usage
  const key = playerId.toString();
  game.forcedDice.set(key, diceValue);  // <--  this is correct

  await game.save();

  res.status(200).json({ message: `Next dice for ${playerId} will be ${diceValue}` });
};

module.exports = { setWinner, boostPlayer, forceDice };
