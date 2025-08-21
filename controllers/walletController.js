// const mongoose = require("mongoose");
// const Wallet = require("../models/Wallet");
// const Transaction = require("../models/Transaction");
// const BankAccount = require("../models/BankAccount");
// const gateway = require("../services/paymentGateway");

// // helper to get/create wallet
// async function getOrCreateWallet(userId, session=null) {
//   let wallet = await Wallet.findOne({ user: userId }).session(session || undefined);
//   if (!wallet) wallet = await Wallet.create([{ user: userId }], { session });
//   return Array.isArray(wallet) ? wallet[0] : wallet;
// }

// exports.getWallet = async (req, res) => {
//   try {
//     const wallet = await getOrCreateWallet(req.user._id);
//     const data = {
//       playMoney: wallet.playBalance,
//       winnings: wallet.winningBalance,
//       cashback: wallet.cashbackBalance,
//       bonus: wallet.bonusBalance,
//       total: wallet.playBalance + wallet.winningBalance + wallet.cashbackBalance + wallet.bonusBalance,
//     };
//     res.json({ ok: true, wallet: data });
//   } catch (e) { res.status(500).json({ ok:false, message:e.message }); }
// };

// // ===== DEPOSIT =====
// exports.initiateDeposit = async (req, res) => {
//   try {
//     const { amount } = req.body; // in rupees
//     if (!amount || amount <= 0) return res.status(400).json({ ok:false, message:"Invalid amount" });

//     const amountPaise = Math.round(Number(amount) * 100);
//     const wallet = await getOrCreateWallet(req.user._id);

//     const { orderId, payUrl, provider } = await gateway.createDepositOrder({
//       userId: req.user._id.toString(),
//       amountPaise,
//     });

//     await Transaction.create({
//       user: req.user._id,
//       wallet: wallet._id,
//       type: "DEPOSIT_INIT",
//       amount: amountPaise,
//       bucket: "PLAY",
//       provider,
//       orderId,
//       status: "PENDING",
//     });

//     res.json({ ok: true, orderId, provider, payUrl });
//   } catch (e) { res.status(500).json({ ok:false, message:e.message }); }
// };

// // ===== WITHDRAW =====
// exports.linkBank = async (req, res) => {
//   try {
//     const { bankName, accountHolder, accountNumber, ifsc } = req.body;
//     if (!bankName || !accountHolder || !accountNumber || !ifsc) {
//       return res.status(400).json({ ok:false, message:"All fields required" });
//     }
//     const ba = await BankAccount.create({
//       user: req.user._id, bankName, accountHolder, accountNumber, ifsc, isPrimary: true
//     });
//     res.json({ ok:true, bank: ba });
//   } catch (e) { res.status(500).json({ ok:false, message:e.message }); }
// };

// exports.requestWithdraw = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { amount } = req.body; // rupees
//     const amountPaise = Math.round(Number(amount) * 100);
//     if (!amountPaise || amountPaise <= 0) throw new Error("Invalid amount");

//     const bank = await BankAccount.findOne({ user: req.user._id }).session(session);
//     if (!bank) throw new Error("Link your bank first");

//     const wallet = await getOrCreateWallet(req.user._id, session);
//     if (wallet.winningBalance < amountPaise) throw new Error("Insufficient withdrawable balance");

//     wallet.winningBalance -= amountPaise;
//     await wallet.save({ session });

//     await Transaction.create([{
//       user: req.user._id,
//       wallet: wallet._id,
//       type: "WITHDRAW_REQUEST",
//       amount: -amountPaise,
//       bucket: "WINNING",
//       status: "PENDING",
//       meta: { bankId: bank._id }
//     }], { session });

//     await session.commitTransaction();
//     res.json({ ok:true, message:"Withdrawal requested. Processing..." });
//   } catch (e) {
//     await session.abortTransaction();
//     res.status(400).json({ ok:false, message:e.message });
//   } finally { session.endSession(); }
// };

// exports.getTransactions = async (req, res) => {
//   try {
//     const tx = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(200);
//     res.json({ ok:true, transactions: tx });
//   } catch (e) { res.status(500).json({ ok:false, message:e.message }); }
// };
