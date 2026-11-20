import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import multer from "multer";
import mongoose from "mongoose";
import config from "./config.js";
import { connectDB } from "./db.js";
import authRoutes from "./auth.js";
import peopleRoutes from "./routes/people.js";
import logsRoutes from "./routes/logs.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1); // behind Vercel / Render / Nginx
app.use("/api", helmet({ contentSecurityPolicy: false }));
app.use("/api", morgan(config.isProd ? "combined" : "dev"));
app.use("/api", express.json({ limit: "100kb" }));

// Health check (does not touch the database)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", db: mongoose.connection.readyState === 1 ? "connected" : "idle" });
});

// Make sure the DB is connected before any data route runs.
app.use("/api", async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    next(Object.assign(new Error("Database unavailable"), { status: 503, expose: true }));
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/people", peopleRoutes);
app.use("/api/logs", logsRoutes);

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Error handler (Express 5 forwards async errors here).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err instanceof multer.MulterError) {
    status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Photo must be 4MB or smaller" : err.message;
  } else if (
    err instanceof mongoose.Error.ValidationError ||
    err instanceof mongoose.Error.CastError
  ) {
    status = 400;
  } else if (err.code === 11000) {
    status = 409;
    message = "A record with that value already exists";
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  }

  if (status >= 500) {
    console.error(err);
    if (!err.expose) message = "Internal server error";
  }

  res.status(status).json({ message, ...(err.body || {}) });
});

export default app;
