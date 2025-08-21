const Ticket = require("../models/Ticket");

// 🎟️ Buy Ticket
exports.buyTicket = async (req, res) => {
  try {
    const { ticketId, userId } = req.body;

    // Find ticket
    const ticket = await Ticket.findById(ticketId);

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

// 🎟️ Get All Tickets
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().populate("lotteryId userId").sort({createdAt:-1});

    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
