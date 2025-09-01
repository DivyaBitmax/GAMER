const Lottery = require("../models/Lottery");
const Ticket = require("../models/Ticket");


//Create Daily Lottery with Sequential Tickets
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


//winner
exports.drawWinners = async (req, res) => {
  try {
    const { ticketNumber, username, prize, profileImage, notes } = req.body;

    if (!ticketNumber) {
      return res.status(400).json({ error: "ticketNumber is required" });
    }

    // Find the ticket by ticketNumber and populate lottery
    const ticket = await Ticket.findOne({ ticketNumber }).populate("lotteryId");

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    if (ticket.status !== "Sold") return res.status(400).json({ error: "Ticket is not sold yet" });

    const lottery = ticket.lotteryId;
    if (!lottery) return res.status(404).json({ error: "Lottery not found for this ticket" });

    // Check if the lottery has already been completed
    if (lottery.isCompleted) {
      return res.status(400).json({ error: "This lottery has already been completed" });
    }

    // Mark this ticket as winner
    ticket.isWinner = true;
    ticket.prize = prize || 0;
    ticket.profileImage = profileImage || "";
    ticket.notes = notes || "";
    ticket.username = username || "";
    await ticket.save();

    // Mark the lottery as completed and save the winner
    lottery.winners = [ticket._id];
    lottery.isCompleted = true;
    await lottery.save();

    res.json({ success: true, winner: ticket });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get Winner by Ticket Number
exports.getWinnerByTicketNumber = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    if (!ticketNumber) {
      return res.status(400).json({ error: "ticketNumber is required" });
    }

    // Find ticket
    const ticket = await Ticket.findOne({ ticketNumber, isWinner: true })
      .populate("lotteryId");

    if (!ticket) {
      return res.status(404).json({ error: "No winner found for this ticket" });
    }

    res.json({
      success: true,
      winner: {
        ticketNumber: ticket.ticketNumber,
        username: ticket.username,
        prize: ticket.prize,
        profileImage: ticket.profileImage,
        notes: ticket.notes,
        lotteryId: ticket.lotteryId?._id,
        drawDate: ticket.lotteryId?.drawDate
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



//Get All Lotteries
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

//Get Lottery by ID (with tickets)
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
