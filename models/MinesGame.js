const mongoose = require("mongoose");

const minesGameSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  betAmount: { type: Number, required: true },
  minesCount: { type: Number, required: true },
  board: { type: [String], default: [] }, // 25 cells -> "mine" / "safe"
  revealed: { type: [Number], default: [] }, // user ne kaunse cell open kiye
  status: { type: String, enum: ["ongoing", "won", "lost", "cashedout"], default: "ongoing" },
  profit: { type: Number, default: 0 },
  mode: { type: String, enum: ["auto", "admin"], default: "auto" }, // game mode
  forcedResult: { type: String, enum: ["win", "lose", null], default: null }, // admin override
}, { timestamps: true });

module.exports = mongoose.model("MinesGame", minesGameSchema);
