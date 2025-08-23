
const mongoose = require("mongoose");

const minesGameSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  betAmount: { type: Number, required: true },
  minesCount: { type: Number, required: true },
  board: { type: [String], default: [] }, // 25 cells -> "mine" / "safe"
  revealed: { type: [Number], default: [] }, // user ne kaunse cell open kiye
  status: { type: String, enum: ["ongoing", "won", "lost", "cashedout"], default: "ongoing" },
  profit: { type: Number, default: 0 },
    // ✅ Naya field
  cashoutAmount: { type: Number, default: 0 },
  mode: { type: String, enum: ["auto", "admin"], default: "auto" }, // game mode
  forcedResult: { type: String, enum: ["win", "lose", null], default: null }, // admin override

  // 🔥 Extra Admin Controls
  nextClick: { type: String, enum: ["boom", "safe", null], default: null }, // force next click
  forceCashout: { type: Number, default: null }, // Xx multiplier
  defaultMines: { type: Number, default: null },
  boardSeed: { type: String, default: null },

  payoutConfig: {
    maxMultiplier: { type: Number, default: 7 },
    baseGainA: { type: Number, default: 0.18 },
    riskGainB: { type: Number, default: 0.45 },
    bonusSafe: { type: Number, default: 0.04 },
    allowCashoutAfter: { type: Number, default: 1 },
    oneWinPerSec: { type: Number, default: 60 },
    forceFirstSafe: { type: Boolean, default: false },
    disableMineChange: { type: Boolean, default: false }
  }

}, { timestamps: true });

module.exports = mongoose.model("MinesGame", minesGameSchema);
