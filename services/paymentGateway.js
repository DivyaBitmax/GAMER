// // const Razorpay = require("razorpay");
// // const crypto = require("crypto");

// // const instance = new Razorpay({
// //   key_id: process.env.RAZORPAY_KEY,
// //   key_secret: process.env.RAZORPAY_SECRET
// // });

// // module.exports = {
// //   async createDepositOrder({ userId, amountPaise }) {
// //     const order = await instance.orders.create({
// //       amount: amountPaise,
// //       currency: "INR",
// //       receipt: `order_rcptid_${userId}`,
// //     });
// //     return { orderId: order.id, payUrl: `https://rzp.io/i/${order.id}`, provider: "RAZORPAY" };
// //   },

// //   verifyWebhookSignature(req) {
// //     const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
// //     shasum.update(JSON.stringify(req.body));
// //     const digest = shasum.digest("hex");
// //     return digest === req.headers["x-razorpay-signature"];
// //   },
// // };

// // Replace with real SDK later
// const crypto = require("crypto");

// module.exports = {
//   async createDepositOrder({ userId, amountPaise, provider = "ANTPAY" }) {
//     // Return a pseudo order ID & a QR/UPI URL you show in-app
//     const orderId = `${provider}_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
//     const payUrl = `upi://pay?pa=merchant@upi&am=${amountPaise/100}&tn=${encodeURIComponent("PlayZelo Deposit")}&tr=${orderId}`;
//     return { orderId, payUrl, provider };
//   },

//   // For webhook verification — stub returns true. Replace as per provider docs.
//   verifyWebhookSignature(req) {
//     return true; // e.g., HMAC with provider secret
//   },
// };


