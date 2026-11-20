// Standalone server: serves the API and the built React app from one process.
// Use this for Render, Railway, Fly.io, a VPS, Docker, etc. (Vercel uses api/index.js.)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import config from "./config.js";
import api from "./app.js";
import { connectDB, disconnectDB } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const indexHtml = path.join(distDir, "index.html");

const server = express();
server.disable("x-powered-by");
server.set("trust proxy", 1);
server.use(api);

if (fs.existsSync(indexHtml)) {
  server.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "img-src": ["'self'", "data:", "blob:"],
          "media-src": ["'self'", "blob:"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "script-src": ["'self'"],
          "worker-src": ["'self'", "blob:"],
          "connect-src": ["'self'"],
          "object-src": ["'none'"],
          "frame-ancestors": ["'none'"],
          "base-uri": ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
  server.use(
    "/assets",
    express.static(path.join(distDir, "assets"), { immutable: true, maxAge: "1y" })
  );
  server.use(express.static(distDir, { index: false, maxAge: "1h" }));
  // SPA fallback: let React Router handle client-side routes.
  server.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    res.set("Cache-Control", "no-cache");
    res.sendFile(indexHtml);
  });
} else if (config.isProd) {
  console.warn("dist/ not found. Run `npm run build` to serve the frontend.");
}

async function start() {
  await connectDB();
  const httpServer = server.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    httpServer.close(async () => {
      await disconnectDB().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
