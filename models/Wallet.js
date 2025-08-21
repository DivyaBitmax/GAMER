// const mongoose = require("mongoose");

// const walletSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, unique: true, required: true },
//   // Spendable for joining games. Recharged via deposit, cashback, some bonuses (as rules allow).
//   playBalance: { type: Number, default: 0 },        // in paise
//   // Withdrawable only if KYC/bank linked etc. Credited from game wins, admin settle, refunds.
//   winningBalance: { type: Number, default: 0 },     // in paise
//   // Read-only for user; cannot withdraw. Can be auto-applied as % of entry fee.
//   cashbackBalance: { type: Number, default: 0 },    // in paise
//   // Promotional; spend-only with caps; cannot withdraw.
//   bonusBalance: { type: Number, default: 0 },       // in paise

//   // For concurrency safety in game joins
//   lockedPlay: { type: Number, default: 0 },
//   lockedWinning: { type: Number, default: 0 },

//   // Simple KYC flags if you need them
//   kycVerified: { type: Boolean, default: false },
   

// }, { timestamps: true });

// module.exports = mongoose.model("Wallet", walletSchema);
