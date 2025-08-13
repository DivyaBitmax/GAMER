const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");
const { JWT_SECRET } = require("../config/config");

// 📝 Register Admin (One-time setup)
exports.registerAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ msg: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ username, password: hashedPassword });
    await admin.save();

    res.status(201).json({ msg: "Admin registered successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// 🔑 Admin Login
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ msg: "Admin login successful", token });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// 🔄 Change Password (Login Required)
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Token se admin ka ID aa jayega
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ msg: "Admin not found" });

    // Old password check
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) return res.status(400).json({ msg: "Old password is incorrect" });

    // New password match check
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    // Save new password
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


// ---------------- Get All Users (Admin Only) ----------------
exports.getAllUsers = async (req, res) => {
  try {
    // Ye check karo ki request admin ka hai
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied. Admins only." });
    }

    const users = await User.find().select("-password -__v");
    res.status(200).json({
      msg: "Users fetched successfully",
      count: users.length,
      users
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};