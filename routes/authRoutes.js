const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
   getProfile
} = require("../controllers/authController");

// 🔹 User Registration
router.post("/register", registerUser);

// 🔹 User Login
router.post("/login", loginUser);


// 🔹 Get profile (protected)
router.get("/profile",  getProfile);


// 🔹 Forgot Password - Send OTP
router.post("/forgot-password", forgotPassword);

// 🔹 Verify OTP
router.post("/verify-otp", verifyOtp);

// 🔹 Reset Password
router.post("/reset-password", resetPassword);

module.exports = router;
