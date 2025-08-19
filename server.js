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

//users signUp+login
app.use("/api/auth", require("./routes/authRoutes"));


//admin login
app.use("/api/admin/auth", require("./routes/adminAuthRoutes"));
app.use("/api/admin", adminRoutes);
app.use("/api/game", gameRoutes);


// lottery
const ticketRoutes = require("./routes/ticketRoutes");
const lotteryRoutes = require("./routes/lotteryRoutes");
app.use("/api/tickets", ticketRoutes);
app.use("/api/lottery", lotteryRoutes);


//another let see

app.get('/live',(req,res)=>{
  res.json({message:"my server is running"});
})

app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
