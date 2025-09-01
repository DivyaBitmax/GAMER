const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { MONGO_URI, PORT } = require("./config/config");
//const adminRoutes = require("./routes/adminLudoRoutes");


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
//app.use("/api/admin", adminRoutes);



// lottery
const ticketRoutes = require("./routes/ticketRoutes");
const lotteryRoutes = require("./routes/lotteryRoutes");
app.use("/api/tickets", ticketRoutes);
app.use("/api/lottery", lotteryRoutes);


//mines
const minesRoutes = require("./routes/minesRoutes");
app.use("/api/mines", minesRoutes);


//ludo
// const gameRoutes = require("./routes/ludoGameRoutes");
// app.use("/api/ludo", gameRoutes);





app.get('/live',(req,res)=>{
  res.json({message:"my server is running"});
})
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));




// const walletRoutes = require("./routes/walletRoutes");      // wallet routes import
// const gameWalletRoutes = require("./routes/gameWalletRoutes"); // game wallet routes import
// //  wallet APIs (deposit, withdraw, balance, txns)
// app.use("/api/wallet", walletRoutes);
// // game wallet APIs (lock entry, settle game)
// app.use("/api/game-wallet", gameWalletRoutes);