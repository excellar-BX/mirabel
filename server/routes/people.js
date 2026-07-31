const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Person = require("../models/Person");

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error("Images only (jpeg, png, webp)"), { status: 400 }));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// GET /api/people — list all (with optional ?type=staff|visitor&status=active|revoked)
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const people = await Person.find(filter).sort({ createdAt: -1 });
    res.json(people);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/people/stats — dashboard counts
router.get("/stats", async (req, res) => {
  try {
    const [totalStaff, totalVisitors, activeStaff, activeVisitors] = await Promise.all([
      Person.countDocuments({ type: "staff" }),
      Person.countDocuments({ type: "visitor" }),
      Person.countDocuments({ type: "staff", status: "active" }),
      Person.countDocuments({ type: "visitor", status: "active" }),
    ]);
    res.json({ totalStaff, totalVisitors, activeStaff, activeVisitors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/people/:idNumber — verify by ID (used at check-in)
router.get("/:idNumber", async (req, res) => {
  try {
    const person = await Person.findOne({ idNumber: req.params.idNumber });
    if (!person) return res.status(404).json({ message: "Person not found" });
    res.json(person);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/people — register new person
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = req.file.filename;

    const person = new Person(data);
    await person.save();
    res.status(201).json(person);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/people/:id/revoke — revoke an ID
router.patch("/:id/revoke", async (req, res) => {
  try {
    const person = await Person.findByIdAndUpdate(
      req.params.id,
      { status: "revoked" },
      { new: true }
    );
    if (!person) return res.status(404).json({ message: "Not found" });
    res.json(person);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/people/:id/activate — re-activate a revoked ID
router.patch("/:id/activate", async (req, res) => {
  try {
    const person = await Person.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );
    if (!person) return res.status(404).json({ message: "Not found" });
    res.json(person);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/people/:id
router.delete("/:id", async (req, res) => {
  try {
    await Person.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;