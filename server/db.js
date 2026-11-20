import mongoose from "mongoose";
import config from "./config.js";

// Note: routes coerce/validate user input to plain strings before querying,
// which blocks operator injection ({"$ne": null}) without breaking our own $gte queries.
mongoose.set("strictQuery", true);

// Cache the connection promise across invocations (serverless) and requests.
let connecting = null;

export function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose
      .connect(config.mongoUri, {
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 10,
      })
      .then(() => console.log("MongoDB connected"))
      .catch((err) => {
        connecting = null; // allow a retry on the next request
        throw err;
      });
  }
  return connecting;
}

export function disconnectDB() {
  connecting = null;
  return mongoose.disconnect();
}
