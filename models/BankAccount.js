// const mongoose = require("mongoose");

// const bankAccountSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
//   bankName: { type: String, required: true },
//   accountHolder: { type: String, required: true },
//   accountNumber: { type: String, required: true },
//   ifsc: { type: String, required: true },
//   isPrimary: { type: Boolean, default: true },
//   verified: { type: Boolean, default: false },
// }, { timestamps: true });

// bankAccountSchema.index({ user: 1, accountNumber: 1 }, { unique: true });

// module.exports = mongoose.model("BankAccount", bankAccountSchema);
