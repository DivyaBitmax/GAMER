const GamePlay = require("../models/GamePlay");
const { rollDice } = require("../utils/diceRoller");
const User = require("../models/User");
const { nanoid } = require("nanoid"); // npm install nanoid

// 🎲 Roll dice for a specific pawn
exports.rollPlayerDice = async (req, res) => {
  try {
    const { gameId, pawnIndex } = req.body; // pawnIndex required
    const playerId = req.user.id;
    const game = await GamePlay.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const now = new Date();

    // Start timer if not already started
    if (!game.timerEnd) {
      game.startTime = now;
      game.timerEnd = new Date(now.getTime() + 5 * 60 * 1000);
    }

    // If time up → end game
    if (now > game.timerEnd) {
      game.isCompleted = true;

      game.players.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if ((a.movesTaken || 0) !== (b.movesTaken || 0)) return (a.movesTaken || 0) - (b.movesTaken || 0);
        const timeA = new Date(a.lastMoveTime || 0).getTime();
        const timeB = new Date(b.lastMoveTime || 0).getTime();
        if (timeA !== timeB) return timeA - timeB;
        if (a.playerIndex !== b.playerIndex) return a.playerIndex - b.playerIndex;
        return a.userId.toString().localeCompare(b.userId.toString());
      });

      game.players.forEach((player, index) => {
        player.rank = index + 1;
        player.isWinner = index === 0;
      });

      await game.save();
      return res.status(200).json({ message: "Game ended", players: game.players });
    }

    if (game.isCompleted) return res.status(400).json({ message: "Game is already completed" });

    // Turn validation
    if (game.currentTurn.toString() !== playerId.toString()) {
      return res.status(403).json({ message: "Not your turn" });
    }

    // Find player
    const player = game.players.find(p => p.userId?.toString() === playerId);
    if (!player) return res.status(404).json({ message: "Player not found" });

    // Pawn validation
    if (pawnIndex < 0 || pawnIndex > 3) {
      return res.status(400).json({ message: "Invalid pawn index" });
    }

    const pawn = player.pawns[pawnIndex];
    if (!pawn) return res.status(400).json({ message: "Pawn not found" });

    // Roll dice (forced or random)
    let dice;
    const forcedValue = game.forcedDice?.get(playerId.toString());
    if (forcedValue !== undefined && forcedValue !== null) {
      dice = forcedValue;
      game.forcedDice.delete(playerId.toString());
    } else {
      dice = rollDice(playerId);
    }

    // Update pawn position & score
    pawn.position += dice;
    if (pawn.position >= 57) { // Ludo home position
      pawn.isHome = true;
      pawn.position = 57;
      player.score += 10; // Bonus for home
    } else {
      player.score += dice;
    }

    // Track moves
    player.movesTaken = (player.movesTaken || 0) + 1;
    player.lastMoveTime = new Date();

    // Log move
    game.moveHistory.push({ player: playerId, pawnIndex, diceValue: dice });

    // Next turn
    const index = game.players.findIndex(p => p.userId?.toString() === playerId);
    const next = (index + 1) % game.players.length;
    game.currentTurn = game.players[next].userId;

    await game.save();

    res.status(200).json({
      message: "Dice rolled",
      dice,
      pawnIndex,
      pawnPosition: pawn.position,
      currentScore: player.score,
      nextTurn: game.currentTurn
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

 // 🎮 Create new game
exports.createGame = async (req, res) => {
  const { playerIds } = req.body;
  if (!Array.isArray(playerIds) || playerIds.length < 2 || playerIds.length > 4) {
    return res.status(400).json({ msg: "Players must be between 2 to 4." });
  }

  try {
    const users = await User.find({ _id: { $in: playerIds } });
    if (users.length !== playerIds.length) {
      return res.status(404).json({ msg: "Some players not found." });
    }

    const players = users.map((user, index) => ({
      userId: user._id,
      username: user.username,
      pawns: [{}, {}, {}, {}],
      score: 0,
      movesTaken: 0,
      lastMoveTime: null,
      playerIndex: index
    }));

    const game = new GamePlay({ players, currentTurn: players[0].userId });
    await game.save();

    return res.status(201).json({ msg: "Game created", gameId: game._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


//📥 Join existing game
exports.joinGame = async (req, res) => {
  const { id } = req.params;
  const { username, userId } = req.body;

  try {
    const game = await GamePlay.findById(id);
    if (!game) return res.status(404).json({ msg: "Game not found" });
    if (game.players.length >= 4) return res.status(400).json({ msg: "Game is full" });

    const existing = game.players.find(p => p.userId.toString() === userId.toString());
    if (existing) return res.status(400).json({ msg: "Player already joined" });

    game.players.push({
      username,
      userId,
      pawns: [{}, {}, {}, {}],
      score: 0,
      movesTaken: 0,
      lastMoveTime: null,
      playerIndex: game.players.length
    });

    if (game.players.length >= 2 && !game.timerEnd) {
      const now = new Date();
      game.timerEnd = new Date(now.getTime() + 5 * 60 * 1000);
      game.startTime = now;
    }

    await game.save();
    res.status(200).json({ msg: "Player joined", game });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


// 🔍 Get game by ID
exports.getGameById = async (req, res) => {
  const { id } = req.params;
  try {
    const game = await GamePlay.findById(id);
    if (!game) return res.status(404).json({ msg: "Game not found" });
    res.status(200).json(game);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


exports.autoJoinGame = async (req, res) => {
  const { username, userId } = req.body;

  try {
    // Find open game (max 4 players)
    let game = await GamePlay.findOne({
      isCompleted: false,
      $expr: { $lt: [{ $size: "$players" }, 4] }
    });

    // If no open game → create one
    if (!game) {
      game = new GamePlay({
        players: [{
          username,
          userId,
          pawns: [{}, {}, {}, {}],
          score: 0,
          movesTaken: 0,
          lastMoveTime: null,
          playerIndex: 0
        }],
        currentTurn: userId
      });
      await game.save();
      return res.status(201).json({ msg: "New game created & joined", gameId: game._id });
    }

    // Already in game check
    if (game.players.some(p => p.userId.toString() === userId.toString())) {
      return res.status(400).json({ msg: "Already in this game", gameId: game._id });
    }

    // Add player to game
    game.players.push({
      username,
      userId,
      pawns: [{}, {}, {}, {}],
      score: 0,
      movesTaken: 0,
      lastMoveTime: null,
      playerIndex: game.players.length
    });

    // Start timer when 2nd player joins
    if (game.players.length >= 2 && !game.timerEnd) {
      const now = new Date();
      game.timerEnd = new Date(now.getTime() + 5 * 60 * 1000);
      game.startTime = now;
    }

    await game.save();
    res.status(200).json({ msg: "Joined existing game", gameId: game._id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
