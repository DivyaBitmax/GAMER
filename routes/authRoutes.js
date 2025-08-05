// // 📁 routes/auth.js
// const express = require("express");
// const router = express.Router();
// const { registerUser, loginUser } = require("../controllers/authController");

// router.post("/register", registerUser);
// router.post("/login", loginUser);

// module.exports = router;


const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword
} = require("../controllers/authController");

// 🔹 User Registration
router.post("/register", registerUser);

// 🔹 User Login
router.post("/login", loginUser);

// 🔹 Forgot Password - Send OTP
router.post("/forgot-password", forgotPassword);

// 🔹 Verify OTP
router.post("/verify-otp", verifyOtp);

// 🔹 Reset Password
router.post("/reset-password", resetPassword);

module.exports = router;
