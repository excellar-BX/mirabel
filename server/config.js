import "dotenv/config";

const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

const config = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: required("MONGO_URI"),
  adminPassword: required("ADMIN_PASSWORD"),
  sessionSecret: required("SESSION_SECRET"),
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS) || 12,
  // IANA timezone used for "today" calculations (visitor dates, daily counts).
  timezone: process.env.APP_TIMEZONE || "Africa/Lagos",
};

if (config.sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters long");
}

try {
  new Intl.DateTimeFormat("en-CA", { timeZone: config.timezone });
} catch {
  throw new Error(`APP_TIMEZONE is not a valid IANA timezone: ${config.timezone}`);
}

export default config;
