const express = require("express");
const router = express.Router();
const { setWinner, boostPlayer } = require("../controllers/adminController");
const { forceDice } = require("../controllers/adminController"); // ✅ Add this
router.post("/set-winner", setWinner);
router.post("/boost-player", boostPlayer);
router.post("/force-dice", forceDice); // ← Add this

module.exports = router;
