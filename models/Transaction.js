// const mongoose = require("mongoose");

// const TX_TYPES = [
//   "DEPOSIT_INIT", "DEPOSIT_SUCCESS", "DEPOSIT_FAILED",
//   "WITHDRAW_REQUEST", "WITHDRAW_SUCCESS", "WITHDRAW_REJECT",
//   "GAME_ENTRY_LOCK", "GAME_ENTRY_RELEASE", "GAME_WIN_CREDIT", "GAME_LOSS_DEBIT",
//   "CASHBACK_CREDIT", "BONUS_CREDIT", "ADJUSTMENT"
// ];

// const transactionSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
//   wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
//   type: { type: String, enum: TX_TYPES, required: true },

//   // positive = credit, negative = debit; always in paise
//   amount: { type: Number, required: true },

//   // Which bucket was affected
//   bucket: { type: String, enum: ["PLAY", "WINNING", "CASHBACK", "BONUS", "MIXED"], required: true },

//   // For deposits/withdrawals
//   provider: { type: String },          // "ANTPAY", "PAYTM", etc.
//   orderId: { type: String, index: true },  // gateway/order id (unique on provider)
//   utr: { type: String, index: true },      // UPI ref / UTR when available
//   status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },

//   // For idempotency & game settlement
//   reference: { type: String, index: true },  // your own unique ref (e.g., gameId, roundId)
//   meta: { type: Object },

// }, { timestamps: true });

// transactionSchema.index({ provider: 1, orderId: 1 }, { unique: true, sparse: true });
// transactionSchema.index({ reference: 1, type: 1 }, { unique: true, sparse: true });

// module.exports = mongoose.model("Transaction", transactionSchema);
