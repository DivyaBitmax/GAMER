const Game = require("../models/LudoGame");
const diceRoll = require("../utils/diceRoll");
const { checkMove, applyMove, handleCutting, checkWinner, SAFE_ZONES  } = require("../utils/gameRules");

// 🎮 Start new game
exports.startGame = async (req, res) => {
  try {
    const { players } = req.body; // array of playerIds
    const game = new Game({
      players: players.map((id, i) => ({
        userId: id,
        color: ["red", "blue", "green", "yellow"][i],
        tokens: new Array(4).fill(null).map(() => ({ position: -1 }))
      })),
      currentTurn: players[0],
      status: "ongoing"
    });
    await game.save();
    res.json({ success: true,
       gameId: game._id,   // ✅ Directly return gameId
      game });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 🎲 Roll Dice

exports.rollDice = async (req, res) => {
  try {
    const { gameId, playerId } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    if (game.currentTurn.toString() !== playerId) {
      return res.status(400).json({ message: "Not your turn" });
    }

    const value = diceRoll();

    // Handle six count
    if (value === 6) {
      game.sixCount += 1;
    } else {
      game.sixCount = 0;
    }

    if (game.sixCount === 3) {
      // Three 6s = cancel turn
      game.sixCount = 0;
      game.currentTurn = getNextPlayer(game, playerId);
      game.diceValue = null;
      await game.save();
      return res.json({ success: true, dice: value, message: "3 sixes, turn skipped", game });
    }

    // ✅ check agar koi move possible hai
    const player = game.players.find(p => p.userId.toString() === playerId);
    const hasMove = player.tokens.some(t => checkMove(t, value));

    if (!hasMove) {
      // koi move possible nahi → turn skip kardo
      game.currentTurn = getNextPlayer(game, playerId);
      game.diceValue = null;
      game.sixCount = 0;
      await game.save();
      return res.json({ success: true, dice: value, message: "No valid move, turn skipped", game });
    }

    // ✅ agar move possible hai → dice value save kardo
    game.diceValue = value;
    await game.save();

    res.json({ success: true, dice: value, game });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// 🟢 Move Token
exports.moveToken = async (req, res) => {
  try {
    const { gameId, playerId, tokenIndex } = req.body;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    if (game.currentTurn.toString() !== playerId) {
      return res.status(400).json({ message: "Not your turn" });
    }

    const player = game.players.find(p => p.userId.toString() === playerId);
    const token = player.tokens[tokenIndex];

    const valid = checkMove(token, game.diceValue);
    if (!valid) return res.status(400).json({ message: "Invalid move" });

    // ✅ Move token
    applyMove(token, game.diceValue);

    // ✅ Check agar star/safe zone par aa gaya
    const starSafe = SAFE_ZONES.includes(token.position);

    // ✅ Handle cutting
    const cut = handleCutting(game, playerId, token.position);

    // ✅ Check winner
    if (checkWinner(player.tokens)) {
      game.status = "finished";
      game.winner = playerId;
    }

    // ✅ Next turn
    if (!(game.diceValue === 6 || cut)) {
      game.currentTurn = getNextPlayer(game, playerId);
    }

    game.diceValue = null; 
    game.sixCount = 0;
    await game.save();

    // ✅ Response me starSafe bhi bhej rahe hain
    res.json({ success: true, cut, starSafe, game });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 🔄 Helper: get next player turn
function getNextPlayer(game, currentId) {
  const ids = game.players.map(p => p.userId.toString());
  const idx = ids.indexOf(currentId);
  return game.players[(idx + 1) % ids.length].userId;
}

