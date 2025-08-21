// const mongoose = require("mongoose");
// const Wallet = require("../models/Wallet");
// const Transaction = require("../models/Transaction");
// const gateway = require("../services/paymentGateway");

// exports.depositWebhook = async (req, res) => {
//   // Validate signature first
//   if (!gateway.verifyWebhookSignature(req)) return res.status(401).send("bad signature");

//   const { provider="ANTPAY", orderId, status, amountPaise, utr } = req.body; // map per provider
//   if (!orderId) return res.status(400).send("orderId missing");

//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const initTx = await Transaction.findOne({ provider, orderId }).session(session);
//     if (!initTx) throw new Error("unknown order");
//     if (initTx.status === "SUCCESS") { // idempotent
//       await session.commitTransaction();
//       return res.json({ ok:true, idempotent:true });
//     }

//     initTx.status = status === "SUCCESS" ? "SUCCESS" : "FAILED";
//     initTx.utr = utr;

//     const wallet = await Wallet.findById(initTx.wallet).session(session);
//     if (status === "SUCCESS") {
//       wallet.playBalance += amountPaise ?? initTx.amount;
//       await Transaction.create([{
//         user: initTx.user,
//         wallet: initTx.wallet,
//         type: "DEPOSIT_SUCCESS",
//         amount: amountPaise ?? initTx.amount,
//         bucket: "PLAY",
//         provider, orderId, utr,
//         status: "SUCCESS"
//       }], { session });
//     } else {
//       await Transaction.create([{
//         user: initTx.user,
//         wallet: initTx.wallet,
//         type: "DEPOSIT_FAILED",
//         amount: 0,
//         bucket: "PLAY",
//         provider, orderId, utr,
//         status: "FAILED"
//       }], { session });
//     }

//     await wallet.save({ session });
//     await initTx.save({ session });
//     await session.commitTransaction();
//     res.json({ ok:true });
//   } catch (e) {
//     await session.abortTransaction();
//     res.status(400).json({ ok:false, message:e.message });
//   } finally { session.endSession(); }
// };
