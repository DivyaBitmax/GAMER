const express = require("express");
const router = express.Router();
const { createLottery, drawWinners, getAllLotteries, getLotteryById } = require("../controllers/lotteryController");

router.post("/create", createLottery);
//router.post("/draw", drawWinners);
// lotteryRoutes.js
// router.post("/:id/winner", drawWinners); // id = lotteryId
// Only ticketNumber needed in body
router.post("/winner", drawWinners);


// New Routes
router.get("/", getAllLotteries);
router.get("/:id", getLotteryById);
module.exports = router;
