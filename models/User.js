const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
  username: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  country: { type: String, required: true },
  address: { type: String, required: true }, // ✅ New field
  city: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }, // Add this line
 
},
 { timestamps: true } // ✅ Ye createdAt aur updatedAt auto add karega
);

module.exports = mongoose.model("User", userSchema);
