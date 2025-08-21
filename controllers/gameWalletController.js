// const mongoose = require("mongoose");
// const Wallet = require("../models/Wallet");
// const Transaction = require("../models/Transaction");

// /**
//  * Lock entry fee for a game. Supports using Play + Winnings (+ optional bonus %).
//  * reference = unique game/seat id per user to make it idempotent.
//  */
// exports.lockEntry = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { entryPaise, reference, useBonusMaxPct = 10 } = req.body;
//     if (!entryPaise || !reference) throw new Error("entryPaise & reference required");

//     // prevent double lock for same reference
//     const exists = await Transaction.findOne({ user: req.user._id, type: "GAME_ENTRY_LOCK", reference }).session(session);
//     if (exists) { await session.commitTransaction(); return res.json({ ok:true, idempotent:true }); }

//     const wallet = await Wallet.findOne({ user: req.user._id }).session(session);
//     if (!wallet) throw new Error("wallet not found");

//     // Bonus rule: up to X% of entry can come from bonus
//     const maxBonus = Math.min(wallet.bonusBalance, Math.floor((useBonusMaxPct/100) * entryPaise));
//     let remaining = entryPaise;

//     // Try Play first, then Winnings, then Bonus (capped)
//     const fromPlay = Math.min(wallet.playBalance, remaining);
//     wallet.playBalance -= fromPlay; wallet.lockedPlay += fromPlay; remaining -= fromPlay;

//     const fromWinning = Math.min(wallet.winningBalance, remaining);
//     wallet.winningBalance -= fromWinning; wallet.lockedWinning += fromWinning; remaining -= fromWinning;

//     let fromBonus = 0;
//     if (remaining > 0) {
//       fromBonus = Math.min(maxBonus, remaining);
//       wallet.bonusBalance -= fromBonus; // bonus is consumed immediately
//       remaining -= fromBonus;
//     }

//     if (remaining > 0) throw new Error("Insufficient balance");

//     await wallet.save({ session });
//     await Transaction.create([{
//       user: req.user._id, wallet: wallet._id, type: "GAME_ENTRY_LOCK",
//       amount: -(entryPaise - fromBonus), bucket: "MIXED",
//       reference, meta: { fromPlay, fromWinning, fromBonus }
//     }], { session });

//     await session.commitTransaction();
//     res.json({ ok:true, locked: entryPaise, breakdown: { fromPlay, fromWinning, fromBonus } });
//   } catch (e) {
//     await session.abortTransaction();
//     res.status(400).json({ ok:false, message:e.message });
//   } finally { session.endSession(); }
// };

// /**
//  * Settle a game result.
//  * outcome: "WIN" | "LOSS" | "CANCEL"
//  * On WIN: credit winnings (to winningBalance).
//  * On LOSS: release locks without credit.
//  * On CANCEL: release locks back to original buckets.
//  */
// exports.settleGame = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { reference, outcome, winAmountPaise = 0 } = req.body;
//     if (!reference || !outcome) throw new Error("reference & outcome required");

//     // Idempotency: one settlement per reference
//     const already = await Transaction.findOne({ user: req.user._id, reference, type: /GAME_(WIN_CREDIT|LOSS_DEBIT|ENTRY_RELEASE)/ }).session(session);
//     if (already) { await session.commitTransaction(); return res.json({ ok:true, idempotent:true }); }

//     const lockTx = await Transaction.findOne({ user: req.user._id, reference, type: "GAME_ENTRY_LOCK" }).session(session);
//     if (!lockTx) throw new Error("No locked entry for this reference");

//     const wallet = await Wallet.findOne({ user: req.user._id }).session(session);

//     const fromPlay = lockTx.meta.fromPlay || 0;
//     const fromWinning = lockTx.meta.fromWinning || 0;

//     if (outcome === "CANCEL") {
//       wallet.lockedPlay -= fromPlay; wallet.playBalance += fromPlay;
//       wallet.lockedWinning -= fromWinning; wallet.winningBalance += fromWinning;
//       await Transaction.create([{
//         user: req.user._id, wallet: wallet._id, type: "GAME_ENTRY_RELEASE",
//         amount: fromPlay + fromWinning, bucket: "MIXED", reference
//       }], { session });
//     }

//     if (outcome === "LOSS") {
//       wallet.lockedPlay -= fromPlay;
//       wallet.lockedWinning -= fromWinning;
//       await Transaction.create([{
//         user: req.user._id, wallet: wallet._id, type: "GAME_LOSS_DEBIT",
//         amount: 0 - (fromPlay + fromWinning), bucket: "MIXED", reference
//       }], { session });
//     }

//     if (outcome === "WIN") {
//       wallet.lockedPlay -= fromPlay;
//       wallet.lockedWinning -= fromWinning;
//       wallet.winningBalance += winAmountPaise; // prize goes to withdrawable bucket
//       await Transaction.create([{
//         user: req.user._id, wallet: wallet._id, type: "GAME_WIN_CREDIT",
//         amount: winAmountPaise, bucket: "WINNING", reference
//       }], { session });
//     }

//     await wallet.save({ session });
//     await session.commitTransaction();
//     res.json({ ok:true });
//   } catch (e) {
//     await session.abortTransaction();
//     res.status(400).json({ ok:false, message:e.message });
//   } finally { session.endSession(); }
// };
