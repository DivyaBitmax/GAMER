const MinesGame = require("../models/MinesGame");

// helper → random mines board generate
function generateBoard(minesCount) {
  let board = Array(25).fill("safe");
  let mineIndexes = [];
  while (mineIndexes.length < minesCount) {
    let rand = Math.floor(Math.random() * 25);
    if (!mineIndexes.includes(rand)) {
      mineIndexes.push(rand);
      board[rand] = "mine";
    }
  }
  return board;
}

// helper → scale profit based on mines count
function scaleForMines(mines) {
  if (mines <= 3)  return 0.28; // very low risk → low bump
  if (mines <= 5)  return 0.30;
  if (mines <= 7)  return 0.32;
  if (mines <= 10) return 0.33; // 10 mines
  return 0.36;                  // 11–15 mines
}

// 🎮 Start Game
exports.startGame = async (req, res) => {
  try {
    const { userId, betAmount, minesCount, mode } = req.body;

    if (!userId || !betAmount || !minesCount) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const board = generateBoard(minesCount);

    const game = new MinesGame({
      userId,
      betAmount,
      minesCount,
      board,
      profit: 0,
      revealed: [],
      mode: mode || "auto",
      status: "ongoing"
    });

    await game.save();

    res.json({ success: true, gameId: game._id, message: "Game started!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🎯 Pick Cell
exports.pickCell = async (req, res) => {
  try {
    const { gameId, cellIndex } = req.body;
    const game = await MinesGame.findById(gameId);

    if (!game || game.status !== "ongoing") {
      return res.status(400).json({ error: "Invalid or finished game" });
    }

    // ✅ check if already revealed
    if (game.revealed.includes(cellIndex)) {
      return res.status(400).json({ error: "Cell already opened" });
    }

    const profitMultiplier = scaleForMines(game.minesCount);

    // admin override
    if (game.mode === "admin" && game.forcedResult) {
      if (game.forcedResult === "lose") {
        game.status = "lost";
        await game.save();
        return res.json({ result: "mine", status: "lost" });
      } else {
        game.revealed.push(cellIndex);
        game.profit += game.betAmount * profitMultiplier;
        await game.save();
        return res.json({ result: "safe", profit: game.profit, revealed: game.revealed });
      }
    }

    // auto mode
    if (game.board[cellIndex] === "mine") {
      game.status = "lost";
      await game.save();
      return res.json({ result: "mine", status: "lost" });
    } else {
      game.revealed.push(cellIndex);
      game.profit += game.betAmount * profitMultiplier;
      await game.save();
      return res.json({ result: "safe", profit: game.profit, revealed: game.revealed });
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 💰 Cashout
// 💰 Cashout
exports.cashout = async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await MinesGame.findById(gameId);

    if (!game || game.status !== "ongoing") {
      return res.status(400).json({ error: "Invalid game" });
    }

    game.status = "cashedout";
    await game.save();

    // total return = original bet + accumulated profit
    const totalReturn = game.betAmount + game.profit;

    res.json({ 
      success: true, 
      profit: game.profit,          // winnings only
      totalReturn: totalReturn,     // bet + profit
      revealed: game.revealed 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// 🛠️ Admin Override
exports.adminOverride = async (req, res) => {
  try {
    const { gameId, forcedResult } = req.body; // "win" or "lose"
    const game = await MinesGame.findById(gameId);

    if (!game) return res.status(404).json({ error: "Game not found" });

    game.mode = "admin";
    game.forcedResult = forcedResult;
    await game.save();

    res.json({ success: true, game });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
