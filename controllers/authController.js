// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../config/config");
const nodemailer = require("nodemailer");


exports.registerUser = async (req, res) => {
  try {
    const { username, dob, country, city, email, phone, password } = req.body;

    if (!username || !dob || !country || !city || !email || !phone || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ msg: "Email or username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      dob,
      country,
      city,
      email,
      phone,
      password: hashedPassword,
    });

    await newUser.save();

    const { password: _, ...userData } = newUser._doc;

    res.status(201).json({
      msg: "User registered successfully",
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};



exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid username or password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};



// let otpStore = {}; // Temporary store { email: { otp, expires, verified } }

// // 📌 Step 1: Forgot Password - Send OTP
// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ msg: "Email not registered" });

//     const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
//     otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000, verified: false };

//     // SMTP transporter
//     const transporter = nodemailer.createTransport({
//       host: process.env.SMTP_HOST,
//       port: process.env.SMTP_PORT,
//       secure: false,
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//       }
//     });

//     await transporter.sendMail({
//       from: `"Ludo Game" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "Password Reset OTP",
//       text: `Your OTP is ${otp}. It will expire in 5 minutes.`
//     });

//     res.json({ msg: "OTP sent to email" });
//   } catch (err) {
//     res.status(500).json({ msg: "Server error", error: err.message });
//   }
// };

// // 📌 Step 2: Verify OTP
// exports.verifyOtp = (req, res) => {
//   const { email, otp } = req.body;
//   const record = otpStore[email];

//   if (!record) return res.status(400).json({ msg: "OTP not requested" });
//   if (Date.now() > record.expires) return res.status(400).json({ msg: "OTP expired" });
//   if (parseInt(otp) !== record.otp) return res.status(400).json({ msg: "Invalid OTP" });

//   otpStore[email].verified = true;
//   res.json({ msg: "OTP verified, you can now reset your password" });
// };

// // 📌 Step 3: Reset Password
// exports.resetPassword = async (req, res) => {
//   try {
//     const { email, newPassword, confirmPassword } = req.body;
//     const record = otpStore[email];

//     if (!record?.verified) return res.status(400).json({ msg: "OTP not verified" });
//     if (newPassword !== confirmPassword) return res.status(400).json({ msg: "Passwords do not match" });

//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     await User.findOneAndUpdate({ email }, { password: hashedPassword });

//     delete otpStore[email]; // Remove OTP from store

//     res.json({ msg: "Password reset successful, please login" });
//   } catch (err) {
//     res.status(500).json({ msg: "Server error", error: err.message });
//   }
// };



let otpStore = {}; // { email: { otp, expires, verified } }
let verifiedEmailStore = {}; // Store email after OTP verification

// 📌 Step 1: Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "Email not registered" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000, verified: false };

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Ludo Game" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`
    });

    res.json({ msg: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// 📌 Step 2: Verify OTP
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.status(400).json({ msg: "OTP not requested" });
  if (Date.now() > record.expires) return res.status(400).json({ msg: "OTP expired" });
  if (parseInt(otp) !== record.otp) return res.status(400).json({ msg: "Invalid OTP" });

  otpStore[email].verified = true;
  verifiedEmailStore[req.sessionID] = email; // Store email for current session

  res.json({ msg: "OTP verified, you can now reset your password" });
};

// 📌 Step 3: Reset Password (No Email Required)
exports.resetPassword = async (req, res) => {
  try {
    const email = verifiedEmailStore[req.sessionID];
    if (!email) return res.status(400).json({ msg: "OTP not verified" });

    const { newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) return res.status(400).json({ msg: "Passwords do not match" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    delete otpStore[email];
    delete verifiedEmailStore[req.sessionID];

    res.json({ msg: "Password reset successful, please login" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
