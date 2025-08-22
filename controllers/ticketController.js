const Lottery = require("../models/Lottery");
const Ticket = require("../models/Ticket");

// 🎟️ Buy Ticket
exports.buyTicket = async (req, res) => {
  try {
    const {  userId } = req.body;
 const { ticketId, } = req.params;
    // Find ticket
    const ticket = await Ticket.findOne({ ticketNumber: ticketId });

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    if (ticket.status === "Sold") return res.status(400).json({ error: "Ticket already sold" });

    // Update ticket
    ticket.status = "Sold";
    ticket.userId = userId;
    ticket.purchasedAt = new Date();

    await ticket.save();

    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// 🎟️ Get Single Ticket by ticketNumber
exports.getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params; // yaha ticketNumber aayega (ex: EM223)

    const ticket = await Ticket.findOne({ ticketNumber: ticketId })
      .populate("lotteryId userId");

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




// 🎟️ Get All Tickets (Latest Lottery Only)
exports.getAllTickets = async (req, res) => {
  try {
    // 1️⃣ Get latest lottery
    const latestLottery = await Lottery.findOne().sort({ createdAt: -1 });

    if (!latestLottery) {
      return res.status(404).json({ success: false, msg: "No lottery found" });
    }

    // 2️⃣ Get tickets only for that lottery
    const tickets = await Ticket.find({ lotteryId: latestLottery._id })
      .populate("lotteryId userId")
      .sort({ createdAt: 1 });

    res.json({ success: true, lotteryId: latestLottery._id, tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
