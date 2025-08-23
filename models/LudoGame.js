// server/models/Game.js

const mongoose = require("mongoose");
const gameSchema = new mongoose.Schema({
  players: [{ userId: String, username: String, position: Number }],
  currentPlayerIndex: { type: Number, default: 0 },
  board: [Number],
  status: { type: String, enum: ["waiting", "in_progress", "finished"], default: "waiting" },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Game", gameSchema);
