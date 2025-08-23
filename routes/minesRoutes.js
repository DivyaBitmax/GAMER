const express = require("express");
const router = express.Router();
const { startGame, pickCell, cashout, adminOverride } = require("../controllers/minesController");

// User routes (no auth for now)
router.post("/start", startGame);
router.post("/pick", pickCell);
router.post("/cashout", cashout);

// Admin route
router.post("/admin-override", adminOverride);

module.exports = router;
