const express = require("express");
const router = express.Router();
const { createLottery, drawWinners, getAllLotteries, getLotteryById,  getWinnerByTicketNumber, getWinnerByLotteryId  } = require("../controllers/lotteryController");

router.post("/create", createLottery);
//router.post("/draw", drawWinners);
// lotteryRoutes.js
// router.post("/:id/winner", drawWinners); // id = lotteryId
// Only ticketNumber needed in body
router.post("/winner", drawWinners);
// Get winner by ticketNumber
//router.get("/winner/:ticketNumber", getWinnerByTicketNumber);

router.get("/winner/:id", getWinnerByLotteryId);


// New Routes
router.get("/", getAllLotteries);
router.get("/:id", getLotteryById);
module.exports = router;
