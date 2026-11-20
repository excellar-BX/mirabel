import express from "express";
import rateLimit from "express-rate-limit";
import Log from "../models/Log.js";
import Person from "../models/Person.js";
import { requireAdmin } from "../auth.js";
import httpError from "../lib/httpError.js";
import { dateStringInZone, dayRangeInZone, isDateString } from "../lib/time.js";

const router = express.Router();

const PERSON_FIELDS = "name idNumber type role department hasPhoto status";

const checkInLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many check-in attempts. Slow down and try again." },
});

// POST /api/logs — log a check-in (public: used by the check-in desk)
router.post("/", checkInLimiter, async (req, res) => {
  const idNumber = typeof req.body?.idNumber === "string" ? req.body.idNumber.trim() : "";
  if (!idNumber || idNumber.length > 64) throw httpError(400, "A valid ID number is required");

  const person = await Person.findOne({ idNumber });
  if (!person) throw httpError(404, "Person not found");
  if (person.status === "revoked") {
    throw httpError(403, "ID has been revoked", { body: { person } });
  }

  // Visitors may only check in on their expected date (in the school's timezone).
  if (person.type === "visitor" && person.expectedDate) {
    const expected = person.expectedDate.toISOString().slice(0, 10);
    if (dateStringInZone() !== expected) {
      throw httpError(403, `Visitor not authorized for today. Expected date: ${expected}`, {
        body: { person },
      });
    }
  }

  const entryPoint =
    typeof req.body.entryPoint === "string" && req.body.entryPoint.trim()
      ? req.body.entryPoint.trim()
      : "Main Gate";

  const log = await Log.create({ person: person._id, entryPoint });
  await log.populate("person", PERSON_FIELDS);
  res.status(201).json({ log, person });
});

router.use(requireAdmin);

// GET /api/logs — optional ?date=YYYY-MM-DD or ?since=<ISO datetime>
router.get("/", async (req, res) => {
  const filter = {};
  let limit = 200;

  if (req.query.date !== undefined) {
    if (!isDateString(req.query.date)) throw httpError(400, "date must be YYYY-MM-DD");
    const { start, end } = dayRangeInZone(req.query.date);
    filter.checkInTime = { $gte: start, $lt: end };
    limit = 5000;
  } else if (req.query.since !== undefined) {
    const since = new Date(String(req.query.since));
    if (Number.isNaN(since.getTime())) throw httpError(400, "since must be a valid date");
    filter.checkInTime = { $gte: since };
    limit = 5000;
  }

  const logs = await Log.find(filter)
    .populate("person", PERSON_FIELDS)
    .sort({ checkInTime: -1 })
    .limit(limit);

  res.json(logs);
});

// GET /api/logs/today/count — check-ins today (school timezone)
router.get("/today/count", async (_req, res) => {
  const { start, end } = dayRangeInZone(dateStringInZone());
  const count = await Log.countDocuments({ checkInTime: { $gte: start, $lt: end } });
  res.json({ count });
});

export default router;
