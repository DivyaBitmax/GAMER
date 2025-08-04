const GamePlay = require("../models/GamePlay");
const { rollDice, getWinningPlayer } = require("../utils/diceRoller");
const User = require("../models/User");



// exports.rollPlayerDice = async (req, res) => {
//   try {
//     const { gameId } = req.body;
//     const playerId = req.user.id;

//     const game = await GamePlay.findById(gameId);
//     if (!game) {
//       return res.status(404).json({ message: "Game not found" });
//     }

//     const now = new Date();

//     // Start timer if not already started
//     if (!game.timerEnd) {
//       game.startTime = now;
//       // game.timerEnd = new Date(now.getTime() + 60000); // 1 minute
//       game.timerEnd = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

//     }

//     // Game already over?
//     if (now > game.timerEnd) {
//       game.isCompleted = true;

//       const sortedPlayers = game.players
//         .map(p => ({ ...p.toObject() }))
//         .sort((a, b) => b.score - a.score);

//       sortedPlayers.forEach((player, index) => {
//         player.rank = index + 1;
//         player.isWinner = index === 0;
//         if (index === 0) {
//           player.congratsMessage = `🎉 Congrats ${player.username}! You are the winner!`;
//         }
//       });

//       game.players = sortedPlayers;
//       await game.save();

//       return res.status(200).json({
//         message: "Game ended",
//         players: sortedPlayers
//       });
//     }

//     if (game.isCompleted) {
//       return res.status(400).json({ message: "Game is already completed" });
//     }

//     // ✅ Validate turn
//     if (game.currentTurn.toString() !== playerId.toString()) {
//       return res.status(403).json({ message: "Not your turn" });
//     }

//     // ✅ Roll the dice
//     // let dice = rollDice(playerId);
//     // if (game.forcedDiceValue) {
//     //   dice = game.forcedDiceValue;
//     //   game.forcedDiceValue = null;
//     // }


//     // ✅ Roll the dice (check forced first)
// let dice;
// const forcedValue = game.forcedDice.get(playerId.toString()); // ✅ use .get()
// console.log("🎯 Checking forced dice:", forcedValue);

// if (forcedValue !== undefined && forcedValue !== null) {
//   dice = forcedValue;
//   game.forcedDice.delete(playerId.toString()); // ✅ use .delete()
//   await game.save();
//   console.log("🎯 Forced dice used:", dice);
// } else {
//   dice = rollDice(playerId);
// }

//     const player = game.players.find(p => p.userId?.toString() === playerId);
//     if (!player) return res.status(404).json({ message: "Player not found" });

//     player.position += dice;
//     player.score += dice;

//     game.moveHistory.push({
//       player: playerId,
//       diceValue: dice,
//     });

//     // ✅ Update turn to next player
//     const index = game.players.findIndex(p => p.userId?.toString() === playerId);
//     const next = (index + 1) % game.players.length;
//     game.currentTurn = game.players[next].userId;

//     await game.save();

//     res.status(200).json({
//       message: "Dice rolled",
//       dice,
//       currentScore: player.score,
//       currentPosition: player.position,
//       nextTurn: game.currentTurn
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error", error: error.message });
//   }
// };


exports.rollPlayerDice = async (req, res) => {
  try {
    const { gameId } = req.body;
    const playerId = req.user.id;
    const game = await GamePlay.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const now = new Date();

    // Start timer if not already started
    if (!game.timerEnd) {
      game.startTime = now;
      game.timerEnd = new Date(now.getTime() + 5 * 60 * 1000); // 5 mins
    }

    // Game ended?
    if (now > game.timerEnd) {
      game.isCompleted = true;

      // ✅ Winner logic with tie-breakers
      game.players.sort((a, b) => {
          // 1. Score (desc)
        if (b.score !== a.score) return b.score - a.score;
          // 2. Least moves taken (asc)
        if ((a.movesTaken || 0) !== (b.movesTaken || 0)) return (a.movesTaken || 0) - (b.movesTaken || 0);
          // 3. Earlier last move time (asc)
        const timeA = new Date(a.lastMoveTime || 0).getTime();
        const timeB = new Date(b.lastMoveTime || 0).getTime();
        if (timeA !== timeB) return timeA - timeB;
          // 4. Earlier playerIndex (asc)
        if (a.playerIndex !== b.playerIndex) return a.playerIndex - b.playerIndex;
         // 5. Fallback: userId alphabetical (asc)
        return a.userId.toString().localeCompare(b.userId.toString());
      });
            // Assign rank and winner
            const topPlayer = game.players[0];

      game.players.forEach((player, index) => {
        player.rank = index + 1;
        player.isWinner = index === 0;
        if (index === 0) {
          player.congratsMessage = `🎉 Congrats ${player.username}! You are the winner!`;
        } else {
          delete player.congratsMessage;
        }
      });

      await game.save();
      return res.status(200).json({ message: "Game ended", players: game.players });
    }

    if (game.isCompleted) return res.status(400).json({ message: "Game is already completed" });

    // Validate turn
    if (game.currentTurn.toString() !== playerId.toString()) {
      return res.status(403).json({ message: "Not your turn" });
    }

    // Dice roll logic
    let dice;
    const forcedValue = game.forcedDice?.get(playerId.toString());
    if (forcedValue !== undefined && forcedValue !== null) {
      dice = forcedValue;
      game.forcedDice.delete(playerId.toString());
      await game.save();
    } else {
      dice = rollDice(playerId);
    }

    const player = game.players.find(p => p.userId?.toString() === playerId);
    if (!player) return res.status(404).json({ message: "Player not found" });

    player.position += dice;
    player.score += dice;

    // ✅ Track for tie-breakers
    player.movesTaken = (player.movesTaken || 0) + 1;
    player.lastMoveTime = new Date();

    game.moveHistory.push({ player: playerId, diceValue: dice });

    // Next turn
    const index = game.players.findIndex(p => p.userId?.toString() === playerId);
    const next = (index + 1) % game.players.length;
    game.currentTurn = game.players[next].userId;

    await game.save();

    res.status(200).json({
      message: "Dice rolled",
      dice,
      currentScore: player.score,
      currentPosition: player.position,
      nextTurn: game.currentTurn
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};




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

    const players = users.map((user) => ({
      userId: user._id,
      username: user.username,
    }));

    const game = new GamePlay({ players, currentTurn: players[0].userId });

    await game.save();

    return res.status(201).json({ msg: "Game created", gameId: game._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};





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


//joingame

// exports.joinGame = async (req, res) => {
//   const { id } = req.params;
//   const { username } = req.body;

//   try {
//     const game = await GamePlay.findById(id);
//     if (!game) return res.status(404).json({ msg: "Game not found" });

//     if (game.players.length >= 4) {
//       return res.status(400).json({ msg: "Game is full" });
//     }

//     const existing = game.players.find(p => p.username === username);
//     if (existing) {
//       return res.status(400).json({ msg: "Player already joined" });
//     }

//     game.players.push({ username });
    
//     // If 2+ players, mark as started and set timer
//     // if (game.players.length >= 2) {
//     //   game.status = "started";
//     //   game.timerEnd = new Date(Date.now() + 60000); // 1 min from now
//     // }

//     if (game.players.length >= 2) {
//   game.status = "started";
//   const now = new Date();
//   game.timerEnd = new Date(now.getTime() + 60000);
//   game.startTime = now;
// }

//     await game.save();

//     res.status(200).json({ msg: "Player joined", game });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error", error: err.message });
//   }
// };


exports.joinGame = async (req, res) => {
  const { id } = req.params;
  const { username, userId } = req.body; // Make sure userId is sent

  try {
    const game = await GamePlay.findById(id);
    if (!game) return res.status(404).json({ msg: "Game not found" });

    if (game.players.length >= 4) {
      return res.status(400).json({ msg: "Game is full" });
    }

    const existing = game.players.find(p => p.username === username);
    if (existing) {
      return res.status(400).json({ msg: "Player already joined" });
    }

    game.players.push({
      username,
      userId,
      position: 0,
      score: 0,
      movesTaken: 0,
      lastMoveTime: null,
      playerIndex: game.players.length
    });

    if (game.players.length >= 2) {
      game.status = "started";
      const now = new Date();
      game.timerEnd = new Date(now.getTime() + 60000);
      game.startTime = now;
    }

    await game.save();
    res.status(200).json({ msg: "Player joined", game });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
