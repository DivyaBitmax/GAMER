const mongoose = require("mongoose");

const lotterySchema = new mongoose.Schema({
  drawDate: { type: Date, required: true },  // 🎯 Lottery Date
  salesStartTime: { type: String, required: true }, // Sales Start
  salesEndTime: { type: String, required: true },   // Sales End
  resultTime: { type: String, required: true },     // Result Time
  ticketPrice: { type: Number, required: true },    // ₹ Ticket Price

  startRange: { type: String, required: true },
  endRange: { type: String, required: true },
  totalTickets: { type: Number, default: 0 },

  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }],
  winners: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }],
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Lottery", lotterySchema);
