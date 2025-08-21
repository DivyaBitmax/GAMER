// const router = require("express").Router();
// const { auth } = require("../middleware/auth");
// const ctrl = require("../controllers/walletController");
// const webhook = require("../controllers/paymentWebhookController");

// // wallet
// router.get("/", auth, ctrl.getWallet);
// router.get("/transactions", auth, ctrl.getTransactions);

// // deposit
// router.post("/deposit/init", auth, ctrl.initiateDeposit);
// // provider webhook (no auth; protect by signature/IP allowlist)
// router.post("/deposit/webhook", webhook.depositWebhook);

// // withdraw + bank
// router.post("/bank/link", auth, ctrl.linkBank);
// router.post("/withdraw", auth, ctrl.requestWithdraw);

// module.exports = router;
