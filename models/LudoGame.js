const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  position: { type: Number, default: -1 }, // -1 = home, 0-51 = board, 100 = finished
});

const playerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  color: String,
  tokens: [tokenSchema],
});

const gameSchema = new mongoose.Schema({
  players: [playerSchema],
  currentTurn: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  diceValue: { type: Number, default: null },
  sixCount: { type: Number, default: 0 }, // track continuous sixes
  status: { type: String, enum: ["waiting", "ready","ongoing", "finished"], default: "waiting" },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
});

module.exports = mongoose.model("Game", gameSchema);
