const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
   password: { type: String, required: true }, // Add this line
 
});

module.exports = mongoose.model("User", userSchema);
