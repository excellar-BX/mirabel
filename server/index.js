require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");

const peopleRoutes = require("./routes/people");
const logsRoutes = require("./routes/logs");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));


// Routes
app.use("/api/people", peopleRoutes);
app.use("/api/logs", logsRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "School ID System API running" });
});

// Global error handler (Express 5 auto-forwards async throws here)
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// Connect DB (cached for serverless)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
};

// Connect DB + start server (for local development)
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  });
}

// Export for Vercel serverless
module.exports = { app, connectDB };