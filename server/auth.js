import crypto from "node:crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import config from "./config.js";
import httpError from "./lib/httpError.js";

const COOKIE_NAME = "mirabel_session";

function sign(payload) {
  return crypto.createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
}

function createToken() {
  const expires = Date.now() + config.sessionTtlHours * 3_600_000;
  const payload = `admin.${expires}`;
  return { token: `${payload}.${sign(payload)}`, expires };
}

function verifyToken(token) {
  if (typeof token !== "string") return false;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const given = Buffer.from(token.slice(idx + 1));
  const expected = Buffer.from(sign(payload));
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return false;
  const expires = Number(payload.split(".")[1]);
  return Number.isFinite(expires) && expires > Date.now();
}

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function passwordMatches(input) {
  if (typeof input !== "string") return false;
  // Hash both sides so the comparison is constant-time regardless of length.
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(config.adminPassword).digest();
  return crypto.timingSafeEqual(a, b);
}

function cookieOptions(req) {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: config.isProd || req.secure,
    path: "/",
  };
}

export function isAdmin(req) {
  return verifyToken(readCookie(req, COOKIE_NAME));
}

export function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  next(httpError(401, "Authentication required"));
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
});

const router = express.Router();

router.post("/login", loginLimiter, (req, res) => {
  if (!passwordMatches(req.body?.password)) {
    throw httpError(401, "Incorrect password");
  }
  const { token, expires } = createToken();
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(req), expires: new Date(expires) });
  res.json({ authenticated: true });
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions(req));
  res.json({ authenticated: false });
});

router.get("/me", (req, res) => {
  res.json({ authenticated: isAdmin(req) });
});

export default router;
