const express = require("express");
const router = express.Router();

// ✅ Import all controller functions
const {
  rollPlayerDice,
  createGame,
  getGameById,
  joinGame
} = require("../controllers/gameController");

// ✅ Authentication middleware
const authenticateUser = require("../middlware/authMiddleware");

// 🎮 Create a new game
router.post("/create", authenticateUser, createGame);

// 🎲 Roll the dice
router.post("/roll-dice", authenticateUser, rollPlayerDice);

// 📥 Join an existing game
router.post("/join/:id", authenticateUser, joinGame);

// 🔍 Get game details by ID
router.get("/:id", authenticateUser, getGameById);

// ✅ Export the router
module.exports = router;
