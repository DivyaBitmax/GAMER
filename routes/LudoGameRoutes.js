const express = require("express");
const router = express.Router();
const gameController = require("../controllers/ludoGameController");

router.post("/start", gameController.startGame);
router.post("/roll", gameController.rollDice);
router.post("/move", gameController.moveToken);

module.exports = router;
