const Game = require("../models/LudoGame");
const diceRoll = require("../utils/diceRoll");
const { checkMove, applyMove, handleCutting, checkWinner, SAFE_ZONES } = require("../utils/gameRules");

const TURN_DURATION = 30000; // 30 seconds



// 🟢 Join Game
exports.joinGame = async (req, res) => {
  try {
    const { playerId } = req.body;

    // ✅ Check for any waiting game (status = waiting & players < 4)
    let game = await Game.findOne({ status: "waiting" });

    if (!game) {
      // ❌ No waiting game → create new
      game = new Game({
        players: [{
          userId: playerId,
          color: "red", // pehle player ko red dena
          tokens: new Array(4).fill(null).map(() => ({ position: -1 }))
        }],
        status: "waiting",
        turnIndex: 0
      });
      await game.save();
      return res.json({ success: true, message: "New game created & joined", game });
    }

    // ✅ Agar game mila aur abhi waiting hai
    if (game.players.length >= 4) {
      // Agar already full hai → new game bana do
      const newGame = new Game({
        players: [{
          userId: playerId,
          color: "red",
          tokens: new Array(4).fill(null).map(() => ({ position: -1 }))
        }],
        status: "waiting",
        turnIndex: 0
      });
      await newGame.save();
      return res.json({ success: true, message: "Room full, new game created", game: newGame });
    }

    // ✅ Assign color based on position
    const colors = ["red", "blue", "green", "yellow"];
    const color = colors[game.players.length];

    // ✅ Add player to existing game
    game.players.push({
      userId: playerId,
      color,
      tokens: new Array(4).fill(null).map(() => ({ position: -1 }))
    });

    // ✅ Agar 4 players ho gaye → mark as ready
    if (game.players.length === 4) {
      game.status = "ready"; // ab bas start hone ka wait
    }

    await game.save();
    return res.json({ success: true, message: "Joined existing game", game });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

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
      status: "ongoing",
      turnStartTime: Date.now(),
      turnDuration: TURN_DURATION
    });
    await game.save();
    res.json({
      success: true,
      gameId: game._id,
      game
    });
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

    // ⏰ Check timer expiry
    if (Date.now() - game.turnStartTime > TURN_DURATION) {
      game.currentTurn = getNextPlayer(game, game.currentTurn.toString());
      game.turnStartTime = Date.now();
      await game.save();
      return res.status(400).json({ message: "⏰ Turn expired! Auto skipped.", game });
    }

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
      game.turnStartTime = Date.now(); // reset timer
      await game.save();
      return res.json({ success: true, dice: value, message: "⚠️ Rolled 3 sixes, turn skipped", game });
    }

    // ✅ check agar koi move possible hai
    const player = game.players.find(p => p.userId.toString() === playerId);
    const hasMove = player.tokens.some(t => checkMove(t, value));

    if (!hasMove) {
      // koi move possible nahi → turn skip kardo
      game.currentTurn = getNextPlayer(game, playerId);
      game.diceValue = null;
      game.sixCount = 0;
      game.turnStartTime = Date.now(); // reset timer
      await game.save();
      return res.json({ success: true, dice: value, message: "🙅 No valid move, turn skipped", game });
    }

    // ✅ agar move possible hai → dice value save kardo
    game.diceValue = value;
    game.turnStartTime = Date.now(); // reset timer (ab 30s wait for move)
    await game.save();

    res.json({ success: true, dice: value, message: "✅ Dice rolled, make your move!", game });
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

    //  ⏰ Check timer expiry
    if (Date.now() - game.turnStartTime > TURN_DURATION) {
      game.currentTurn = getNextPlayer(game, game.currentTurn.toString());
      game.turnStartTime = Date.now();
      await game.save();
      return res.status(400).json({ message: "⏰ Turn expired! Auto skipped.", game });
    }

    if (game.currentTurn.toString() !== playerId) {
      return res.status(400).json({ message: "Not your turn" });
    }

    const player = game.players.find(p => p.userId.toString() === playerId);

    if (tokenIndex < 0 || tokenIndex >= player.tokens.length) {
      return res.status(400).json({ message: "Invalid token index" });
    }

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
    game.turnStartTime = Date.now(); // reset timer
    await game.save();

    // ✅ Dynamic message banaya
    let moveMessage = "✅ Token moved successfully";
    if (starSafe) moveMessage += " (landed on Safe Zone ⭐)";
    if (cut) moveMessage += " and opponent was cut 🔪";

    res.json({
      success: true,
      cut,
      starSafe,
      message: moveMessage,
      game
    });
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
