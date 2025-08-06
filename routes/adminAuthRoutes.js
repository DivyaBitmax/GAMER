// const express = require("express");
// const router = express.Router();
// const { registerAdmin, loginAdmin } = require("../controllers/adminAuthController");

// // 📝 Register (One-time setup)
// router.post("/register", registerAdmin);

// // 🔑 Login
// router.post("/login", loginAdmin);

// module.exports = router;




const express = require("express");
const router = express.Router();
const authenticateUser = require("../middlware/authMiddleware"); // tumhara existing middleware

const { registerAdmin, loginAdmin, changePassword } = require("../controllers/adminAuthController");

// 📝 Register
router.post("/register", registerAdmin);

// 🔑 Login
router.post("/login", loginAdmin);

// 🔄 Change Password (Login Required)
router.post("/change-password", authenticateUser, changePassword);

module.exports = router;
