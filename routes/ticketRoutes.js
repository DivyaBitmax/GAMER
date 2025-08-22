const express = require("express");
const router = express.Router();
const { buyTicket, getAllTickets, getTicketById } = require("../controllers/ticketController");

router.post("/:ticketId/buy", buyTicket);
router.get("/:ticketId", getTicketById);        // Get single ticket by ticketNumber
// New Route
router.get("/", getAllTickets);
module.exports = router;
