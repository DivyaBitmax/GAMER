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

    if (game.revealed.includes(cellIndex)) {
      return res.status(400).json({ error: "Cell already opened" });
    }

    // ✅ Admin Force Next Click
    if (game.mode === "admin" && game.nextClick) {
      if (game.nextClick === "boom") {
        game.status = "lost";
        await game.save();
        return res.json({ result: "mine", status: "lost" });
      }
      if (game.nextClick === "safe") {
        game.revealed.push(cellIndex);
        game.profit += game.betAmount * game.payoutConfig.baseGainA;
         game.safePicks += 1; // Increment safe picks
        await game.save();
        return res.json({ result: "safe", profit: game.profit, revealed: game.revealed });
      }
    }

    // ✅ Forced Win/Lose
    if (game.mode === "admin" && game.forcedResult) {
      if (game.forcedResult === "lose") {
        game.status = "lost";
        await game.save();
        return res.json({ result: "mine", status: "lost" });
      } else {
        game.revealed.push(cellIndex);
        game.profit += game.betAmount * game.payoutConfig.baseGainA;
          game.safePicks += 1; // Increment safe picks
        await game.save();
        return res.json({ result: "safe", profit: game.profit, revealed: game.revealed });
      }
    }

    // Normal auto mode
    if (game.board[cellIndex] === "mine") {
      game.status = "lost";
      await game.save();
      return res.json({ result: "mine", status: "lost" });
    } else {
      game.revealed.push(cellIndex);
      game.profit += game.betAmount * game.payoutConfig.baseGainA;
        game.safePicks += 1; // Increment safe picks
      await game.save();
      return res.json({ result: "safe", profit: game.profit, revealed: game.revealed,  safePicks: game.safePicks });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cashout = async (req, res) => {
  try {
    const { gameId } = req.body;
    const game = await MinesGame.findById(gameId);

    if (!game || game.status !== "ongoing") {
      return res.status(400).json({ error: "Invalid game" });
    }

    let totalReturn;

    // ✅ Admin Forced Cashout
    if (game.forceCashout) {
      totalReturn = game.betAmount * game.forceCashout;
    } else {
      totalReturn = game.betAmount + game.profit;
    }

    game.status = "cashedout";
    game.cashoutAmount = totalReturn;   // ✅ naya amount save karo
    await game.save();

    res.json({
      success: true,
      profit: game.profit,
      totalReturn,
      revealed: game.revealed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🛠️ Admin Override
exports.adminOverride = async (req, res) => {
  try {
    const { gameId, forcedResult, nextClick, forceCashout, defaultMines, boardSeed, payoutConfig } = req.body;
    const game = await MinesGame.findById(gameId);
    if (!game) return res.status(404).json({ error: "Game not found" });

    game.mode = "admin";
    if (forcedResult) game.forcedResult = forcedResult;
    if (nextClick) game.nextClick = nextClick;
    if (forceCashout) game.forceCashout = forceCashout;
    if (defaultMines) game.defaultMines = defaultMines;
    if (boardSeed) game.boardSeed = boardSeed;
    if (payoutConfig) game.payoutConfig = { ...game.payoutConfig, ...payoutConfig };

    await game.save();
    res.json({ success: true, game });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// 📊 Dashboard Metrics
exports.getStats = async (req, res) => {
  try {
    // ✅ Total unique users
    const totalUsers = (await MinesGame.distinct("userId")).length;

    // ✅ Total bets (sum of betAmount)
  // ✅ Total bets (only initial betAmount when game started)
    const betsAgg = await MinesGame.aggregate([
      { $match: { status: { $in: ["ongoing", "cashedout", "lost"] } } }, // sirf valid games
      { $group: { _id: null, total: { $sum: "$betAmount" } } }
    ]);
    const totalBets = betsAgg[0]?.total || 0;

    // ✅ Total Cashouts (sum of cashoutAmount)
    const cashoutAgg = await MinesGame.aggregate([
      { $match: { status: "cashedout" } },
      { $group: { _id: null, total: { $sum: "$cashoutAmount" } } }
    ]);
    const totalCashouts = cashoutAgg[0]?.total || 0;

    // ✅ Active players
    const activePlayers = (await MinesGame.distinct("userId", { status: "ongoing" })).length;

    res.json({
      totalUsers,
      totalBets,
      totalCashouts,
      activePlayers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
