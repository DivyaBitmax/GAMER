const express = require("express");
const router = express.Router();
const authenticateUser = require("../middlware/authMiddleware"); // tumhara existing middleware

const { registerAdmin, loginAdmin, changePassword ,getAllUsers} = require("../controllers/adminAuthController");

// 📝 Register
router.post("/register", registerAdmin);

// 🔑 Login
router.post("/login", loginAdmin);

// 🔄 Change Password (Login Required)
router.post("/change-password", authenticateUser, changePassword);



router.get("/users",  getAllUsers);
module.exports = router;
