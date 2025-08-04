const mongoose = require("mongoose");

const gamePlaySchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Game",
  },
  players: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      username: String,
      position: {
        type: Number,
        default: 0,
      },
      score: {
        type: Number,
        default: 0,
      },
      isWinner: {
        type: Boolean,
        default: false,
      },

 rank: {
      type: Number,
      default: null
    }

    },
  ],
  priorityWinnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  currentTurn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  moveHistory: [
    {
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      diceValue: Number,
      cutPlayer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // forcedDiceValue: {
  //   type: Number,
  //   default: null,
  // },

forcedDice: {
  type: Map,
  of: Number,
  default: {},
},


  timerEnd: {
    type: Date,
    default: null,
  },
  isTimerRunning: {
    type: Boolean,
    default: false,
  },
  joinIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  moveIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isCompleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("GamePlay", gamePlaySchema);



