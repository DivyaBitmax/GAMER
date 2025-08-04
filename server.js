const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { MONGO_URI, PORT } = require("./config/config");

const adminRoutes = require("./routes/adminRoutes");
const gameRoutes = require("./routes/gameRoutes");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(MONGO_URI)
  .then(() => console.log(" MongoDB connected"))
  .catch((err) => console.error(" Mongo error:", err));

app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/admin", adminRoutes);
app.use("/api/game", gameRoutes);

app.listen(PORT, () => console.log(` Server running on port ${PORT}`));

