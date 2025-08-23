const Lottery = require("../models/Lottery");
const Ticket = require("../models/Ticket");


// 🎯 Create Daily Lottery with Sequential Tickets
exports.createLottery = async (req, res) => {
  try {
    const {
      drawDate,
      salesStartTime,
      salesEndTime,
      resultTime,
      ticketPrice,
      startRange,
      endRange
    } = req.body;

    //  Lottery save with all settings
    const lottery = new Lottery({
      drawDate,
      salesStartTime,
      salesEndTime,
      resultTime,
      ticketPrice,
      startRange,
      endRange
    });
    await lottery.save();

    //  Sequential ticket generation
    let tickets = [];
    let startNum = parseInt(startRange.replace(/\D/g, "")); // e.g. "1E200" => 200
    let endNum = parseInt(endRange.replace(/\D/g, ""));     // e.g. "1F900" => 900
    let prefixStart = startRange.replace(/[0-9]/g, "");     // "1E"
    let prefixEnd = endRange.replace(/[0-9]/g, "");         // "1F"

    // Same prefix (like 1E200 → 1E900)
    if (prefixStart === prefixEnd) {
      for (let i = startNum; i <= endNum; i++) {
        tickets.push({
          lotteryId: lottery._id,
          ticketNumber: `${prefixStart}${i}`,
          status: "Available",
          price: ticketPrice
        });
      }
    } else {
      // Agar prefix change hota hai (like 1E200 → 1F900)
      for (let prefix of [prefixStart, prefixEnd]) {
        let rangeStart = prefix === prefixStart ? startNum : 0;
        let rangeEnd = prefix === prefixEnd ? endNum : 9999;

        for (let i = rangeStart; i <= rangeEnd; i++) {
          tickets.push({
            lotteryId: lottery._id,
            ticketNumber: `${prefix}${i}`,
            status: "Available",
            price: ticketPrice
          });
        }
      }
    }

    // Bulk insert
    const createdTickets = await Ticket.insertMany(tickets);

    // Save tickets in lottery
    lottery.tickets = createdTickets.map(t => t._id);
    lottery.totalTickets = createdTickets.length;
    await lottery.save();

    res.json({
      success: true,
      totalTickets: createdTickets.length,
      lottery,
      tickets: createdTickets
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🏆 Draw Winners (Top 10 Random)
// exports.drawWinners = async (req, res) => {
//   try {
//     const { lotteryId } = req.body;
//     const lottery = await Lottery.findById(lotteryId).populate("tickets");

//     if (!lottery) return res.status(404).json({ error: "Lottery not found" });
//     if (lottery.isCompleted) return res.json({ message: "Winners already drawn" });

//     const soldTickets = lottery.tickets.filter(t => t.status === "Sold");
//     if (soldTickets.length < 10) return res.json({ error: "Not enough participants" });

//     // Random shuffle
//     const shuffled = soldTickets.sort(() => 0.5 - Math.random());
//     const winners = shuffled.slice(0, 10);

//     lottery.winners = winners;
//     lottery.isCompleted = true;
//     await lottery.save();

//     res.json({ success: true, winners });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// exports.drawWinners = async (req, res) => {
//   try {
//     const lotteryId = req.params.id;          // <-- use URL param
//     const { ticketNumber, username, prize, profileImage, notes } = req.body;

//     const lottery = await Lottery.findById(lotteryId).populate("tickets");
//     if (!lottery) return res.status(404).json({ error: "Lottery not found" });

//     // Find sold ticket
//     const ticket = lottery.tickets.find(
//       t => t.ticketNumber === ticketNumber && t.status === "Sold"
//     );
//     if (!ticket) return res.status(404).json({ error: "Ticket not found or not sold" });

//     // Mark as winner and save extra info
//     ticket.isWinner = true;
//     ticket.prize = prize || 0;
//     ticket.profileImage = profileImage || "";
//     ticket.notes = notes || "";
//     ticket.username = username || "";
//     await ticket.save();

//     // Add to lottery winners array
//     lottery.winners = [ticket._id];   // single winner for now
//     lottery.isCompleted = true;       // marks lottery as completed
//     await lottery.save();

//     res.json({ success: true, winner: ticket });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// 🔹 Get All Lotteries


exports.drawWinners = async (req, res) => {
  try {
    const lotteryId = req.params.id; // <-- Lottery ID passed in URL param
    const { ticketNumber, username, prize, profileImage, notes } = req.body;

    // Find the lottery by ID
    const lottery = await Lottery.findById(lotteryId).populate("tickets");
    if (!lottery) return res.status(404).json({ error: "Lottery not found" });

    // Check if the lottery has already been completed
    if (lottery.isCompleted) {
      return res.status(400).json({ error: "This lottery has already been completed" });
    }

    // Ensure only one winner per lottery
    const existingWinner = lottery.winners.length > 0;
    if (existingWinner) {
      return res.status(400).json({ error: "A winner has already been selected for this lottery" });
    }

    // Find the ticket by ticketNumber and ensure it is "Sold"
    const ticket = lottery.tickets.find(
      t => t.ticketNumber === ticketNumber && t.status === "Sold"
    );
    if (!ticket) return res.status(404).json({ error: "Ticket not found or not sold" });

    // Mark this ticket as a winner
    ticket.isWinner = true;
    ticket.prize = prize || 0;
    ticket.profileImage = profileImage || "";
    ticket.notes = notes || "";
    ticket.username = username || "";
    await ticket.save();

    // Mark the lottery as completed and save the winner in the lottery's winners array
    lottery.winners = [ticket._id];   // single winner for this lottery
    lottery.isCompleted = true;       // marks lottery as completed
    await lottery.save();

    res.json({ success: true, winner: ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




exports.getAllLotteries = async (req, res) => {
  try {
    const lotteries = await Lottery.find()
      .populate("winners") // winners tickets ke saath
      .sort({ createdAt: -1 });

    res.json({ success: true, lotteries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔹 Get Lottery by ID (with tickets)
exports.getLotteryById = async (req, res) => {
  try {
    const { id } = req.params;
    const lottery = await Lottery.findById(id).populate("tickets");

    if (!lottery) return res.status(404).json({ error: "Lottery not found" });

    res.json({ success: true, lottery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
