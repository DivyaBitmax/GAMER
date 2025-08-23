const GamePlay = require("../models/LudoGamePlay");
const { rollDice } = require("../utils/diceRoller");
const User = require("../models/User");


// 🎲 Roll dice for a specific pawn
// exports.rollPlayerDice = async (req, res) => {
//   try {
//     const { gameId, pawnIndex } = req.body;
//     const playerId = req.user.id;
//     const game = await GamePlay.findById(gameId);
//     if (!game) return res.status(404).json({ message: "Game not found" });

//     const now = new Date();

//     if (!game.timerEnd) {
//       game.startTime = now;
//       game.timerEnd = new Date(now.getTime() + 5 * 60 * 1000);
//     }

//     if (now > game.timerEnd) {
//       game.isCompleted = true;

//       game.players.sort((a, b) => {
//         if (b.score !== a.score) return b.score - a.score;
//         if ((a.movesTaken || 0) !== (b.movesTaken || 0)) return (a.movesTaken || 0) - (b.movesTaken || 0);
//         const timeA = new Date(a.lastMoveTime || 0).getTime();
//         const timeB = new Date(b.lastMoveTime || 0).getTime();
//         if (timeA !== timeB) return timeA - timeB;
//         if (a.playerIndex !== b.playerIndex) return a.playerIndex - b.playerIndex;
//         return a.userId.toString().localeCompare(b.userId.toString());
//       });

//       game.players.forEach((player, index) => {
//         player.rank = index + 1;
//         player.isWinner = index === 0;
//       });

//       await game.save();
//       return res.status(200).json({ message: "Game ended", players: game.players });
//     }

//     if (game.isCompleted) return res.status(400).json({ message: "Game is already completed" });

//     if (game.currentTurn.toString() !== playerId.toString()) {
//       return res.status(403).json({ message: "Not your turn" });
//     }

//     const player = game.players.find(p => p.userId?.toString() === playerId);
//     if (!player) return res.status(404).json({ message: "Player not found" });

//     if (pawnIndex < 0 || pawnIndex > 3) {
//       return res.status(400).json({ message: "Invalid pawn index" });
//     }

//     const pawn = player.pawns[pawnIndex];
//     if (!pawn) return res.status(400).json({ message: "Pawn not found" });

//     // 👉 Ensure playerSixCount is initialized
//     if (!game.playerSixCount) game.playerSixCount = new Map();
//     if (!game.playerSixCount[playerId]) game.playerSixCount[playerId] = 0;

//     let dice;
//     const forcedValue = game.forcedDice?.get(playerId.toString());

//     // 🔁 Six logic
//     const sixCount = game.playerSixCount[playerId] || 0;

//     if (forcedValue !== undefined && forcedValue !== null) {
//       dice = forcedValue;
//       game.forcedDice.delete(playerId.toString());
//     } else {
//       if (sixCount >= 2) {
//         // Block third six
//         dice = Math.floor(Math.random() * 5) + 1; // 1 to 5 only
//       } else {
//         dice = rollDice(playerId); // 1 to 6
//       }
//     }

//     // Track 6s
//     if (dice === 6) {
//       game.playerSixCount[playerId] = sixCount + 1;
//     } else {
//       game.playerSixCount[playerId] = 0;
//     }

//     // 🟢 Update pawn and score
//     pawn.position += dice;
//     if (pawn.position >= 57) {
//       pawn.isHome = true;
//       pawn.position = 57;
//       player.score += 10;
//     } else {
//       player.score += dice;
//     }

//     player.movesTaken = (player.movesTaken || 0) + 1;
//     player.lastMoveTime = new Date();

//     game.moveHistory.push({ player: playerId, pawnIndex, diceValue: dice });

//     // 🧠 Extra turn if 6, otherwise switch turn
//     if (dice !== 6) {
//       const index = game.players.findIndex(p => p.userId?.toString() === playerId);
//       const next = (index + 1) % game.players.length;
//       game.currentTurn = game.players[next].userId;
//     }

//     await game.save();

//     res.status(200).json({
//       message: "Dice rolled",
//       dice,
//       pawnIndex,
//       pawnPosition: pawn.position,
//       currentScore: player.score,
//       nextTurn: game.currentTurn
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };


const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47]; 


exports.rollPlayerDice = async (req, res) => {
  try {
    const { gameId, pawnIndex } = req.body;
    const playerId = req.user.id;
    const game = await GamePlay.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const now = new Date();
    if (!game.timerEnd) {
      game.startTime = now;
      game.timerEnd = new Date(now.getTime() + 5 * 60 * 1000);
    }

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
    if (game.currentTurn.toString() !== playerId.toString()) {
      return res.status(403).json({ message: "Not your turn" });
    }

    const player = game.players.find(p => p.userId?.toString() === playerId);
    if (!player) return res.status(404).json({ message: "Player not found" });

    if (pawnIndex < 0 || pawnIndex > 3) return res.status(400).json({ message: "Invalid pawn index" });
    const pawn = player.pawns[pawnIndex];
    if (!pawn) return res.status(400).json({ message: "Pawn not found" });

    if (!game.playerSixCount) game.playerSixCount = new Map();
    if (!game.playerSixCount[playerId]) game.playerSixCount[playerId] = 0;

    let dice;
    const forcedValue = game.forcedDice?.get(playerId.toString());
    const sixCount = game.playerSixCount[playerId] || 0;

    if (forcedValue !== undefined && forcedValue !== null) {
      dice = forcedValue;
      game.forcedDice.delete(playerId.toString());
    } else {
      dice = (sixCount >= 2) ? Math.floor(Math.random() * 5) + 1 : rollDice(playerId);
    }

    game.playerSixCount[playerId] = (dice === 6) ? sixCount + 1 : 0;

    pawn.position += dice;
    if (pawn.position >= 57) {
      pawn.isHome = true;
      pawn.position = 57;
      player.score += 10;
    } else {
      player.score += dice;
    }

    player.movesTaken = (player.movesTaken || 0) + 1;
    player.lastMoveTime = new Date();

    game.moveHistory.push({ player: playerId, pawnIndex, diceValue: dice });

    // 🔪 Kill logic
    // let killed = false;
    // let killedPlayerName = null;

    // if (!SAFE_SPOTS.includes(pawn.position)) {
    //   for (let op of game.players) {
    //     if (op.userId.toString() === playerId.toString()) continue;

    //     for (let i = 0; i < op.pawns.length; i++) {
    //       const enemyPawn = op.pawns[i];
    //       if (enemyPawn.position === pawn.position && !enemyPawn.isHome && enemyPawn.position !== -1) {
    //         enemyPawn.position = -1; // send to base
    //         killed = true;
    //         killedPlayerName = op.name || "Opponent";
    //         break;
    //       }
    //     }
    //     if (killed) break;
    //   }
    // }

// 🔪 Kill logic
// 🔪 Kill logic


let killed = false;
let killedPlayerName = null;

if (!SAFE_SPOTS.includes(pawn.position)) {
  for (let op of game.players) {
    if (op.userId.toString() === playerId.toString()) continue; // ✅ skip same player

    for (let i = 0; i < op.pawns.length; i++) {
      const enemyPawn = op.pawns[i];

      if (
        enemyPawn.position === pawn.position &&
        !enemyPawn.isHome &&
        enemyPawn.position !== -1 &&
        enemyPawn.position !== 57 // already home
      ) {
        enemyPawn.position = 0; // ✅ send to STARTING point
        killed = true;
        killedPlayerName = op.name || "Opponent";
        break;
      }
    }
    if (killed) break;
  }
}

    // 🗨 Message logic
    let message = "Dice rolled";
    const currentPlayerName = player.name || "You";
    if (killed) {
      message = `${currentPlayerName} killed ${killedPlayerName}'s pawn!`;
    } else if (SAFE_SPOTS.includes(pawn.position)) {
      message = `${currentPlayerName}'s pawn is safe on spot ${pawn.position}`;
    }

    // 🔁 Turn logic
    if (!(dice === 6 || killed)) {
      const index = game.players.findIndex(p => p.userId?.toString() === playerId);
      const next = (index + 1) % game.players.length;
      game.currentTurn = game.players[next].userId;
    }

    await game.save();

    return res.status(200).json({
      message,
      dice,
      pawnIndex,
      pawnPosition: pawn.position,
      currentScore: player.score,
      nextTurn: game.currentTurn
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
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
