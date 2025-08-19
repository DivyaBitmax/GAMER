const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  lotteryId: { type: mongoose.Schema.Types.ObjectId, ref: "Lottery", required: true },
  ticketNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ["Available", "Sold"], default: "Available" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  purchasedAt: { type: Date, default: null },
  price: { type: Number, default: 10 },// fixed ₹10
// New fields for manual winner
  isWinner: { type: Boolean, default: false },
  prize: { type: Number, default: 0 },
  profileImage: { type: String, default: "" },
  notes: { type: String, default: "" },
  username: { type: String, default: "" }
});

module.exports = mongoose.model("Ticket", ticketSchema);
