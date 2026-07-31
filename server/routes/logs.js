const express = require("express");
const router = express.Router();
const Log = require("../models/Log");
const Person = require("../models/Person");


// GET /api/logs — all logs, optional ?date=YYYY-MM-DD
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.date) {
      const start = new Date(req.query.date);
      const end = new Date(req.query.date);
      end.setDate(end.getDate() + 1);
      filter.checkInTime = { $gte: start, $lt: end };
    }

    const logs = await Log.find(filter)
      .populate("person", "name idNumber type role department photo status")
      .sort({ checkInTime: -1 })
      .limit(200);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/logs/today/count — how many check-ins today
router.get("/today/count", async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const count = await Log.countDocuments({ checkInTime: { $gte: start } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/logs — log a check-in
router.post("/", async (req, res) => {
  try {
    const { idNumber, entryPoint } = req.body;

    const person = await Person.findOne({ idNumber });
    if (!person) return res.status(404).json({ message: "Person not found" });
    if (person.status === "revoked")
      return res.status(403).json({ message: "ID has been revoked", person });

    // Check if visitor is checking in on expected date
    if (person.type === "visitor" && person.expectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expected = new Date(person.expectedDate);
      expected.setHours(0, 0, 0, 0);

      if (today.getTime() !== expected.getTime()) {
        return res.status(403).json({
          message: `Visitor not authorized for today. Expected date: ${person.expectedDate.toISOString().split('T')[0]}`,
          person
        });
      }
    }

    const log = new Log({
      person: person._id,
      entryPoint: entryPoint || "Main Gate",
    });
    await log.save();

    const populated = await log.populate("person", "name idNumber type role department photo status");
    res.status(201).json({ log: populated, person });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;