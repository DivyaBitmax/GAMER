const express = require("express");
const router = express.Router();
const { buyTicket, getAllTickets } = require("../controllers/ticketController");

router.post("/:ticketId/buy", buyTicket);
// New Route
router.get("/", getAllTickets);
module.exports = router;
