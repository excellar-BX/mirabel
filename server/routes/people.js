import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import Person from "../models/Person.js";
import { requireAdmin } from "../auth.js";
import httpError from "../lib/httpError.js";
import { isDateString } from "../lib/time.js";

const router = express.Router();

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // Vercel caps request bodies at 4.5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1, fields: 20 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(httpError(400, "Photo must be a JPEG, PNG or WebP image"));
  },
});

const STAFF_FIELDS = ["role", "department"];
const VISITOR_FIELDS = ["purpose", "hostName", "expectedDate"];

function validObjectId(req, _res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, "Invalid id");
  next();
}

function pickString(value) {
  return typeof value === "string" ? value.trim() : undefined;
}

// GET /api/people/:id/photo — public so ID cards render at the check-in desk.
router.get("/:id/photo", validObjectId, async (req, res) => {
  const person = await Person.findById(req.params.id).select(
    "+photoData +photoType hasPhoto updatedAt"
  );
  if (!person?.hasPhoto || !person.photoData) throw httpError(404, "Photo not found");
  res.set({
    "Content-Type": person.photoType || "image/jpeg",
    "Cache-Control": "private, max-age=86400",
    "Last-Modified": person.updatedAt.toUTCString(),
  });
  res.send(person.photoData);
});

// Everything below is admin-only.
router.use(requireAdmin);

// GET /api/people — list (optional ?type=staff|visitor&status=active|revoked)
router.get("/", async (req, res) => {
  const filter = {};
  if (["staff", "visitor"].includes(req.query.type)) filter.type = req.query.type;
  if (["active", "revoked"].includes(req.query.status)) filter.status = req.query.status;

  const people = await Person.find(filter).sort({ createdAt: -1 }).limit(1000);
  res.json(people);
});

// GET /api/people/stats — dashboard counts
router.get("/stats", async (_req, res) => {
  const [totalStaff, totalVisitors, activeStaff, activeVisitors] = await Promise.all([
    Person.countDocuments({ type: "staff" }),
    Person.countDocuments({ type: "visitor" }),
    Person.countDocuments({ type: "staff", status: "active" }),
    Person.countDocuments({ type: "visitor", status: "active" }),
  ]);
  res.json({ totalStaff, totalVisitors, activeStaff, activeVisitors });
});

// GET /api/people/:idNumber — look up by ID number
router.get("/:idNumber", async (req, res) => {
  const person = await Person.findOne({ idNumber: String(req.params.idNumber) });
  if (!person) throw httpError(404, "Person not found");
  res.json(person);
});

// POST /api/people — register a new person
router.post("/", upload.single("photo"), async (req, res) => {
  const body = req.body || {};
  const type = pickString(body.type);
  if (!["staff", "visitor"].includes(type)) throw httpError(400, "Type must be staff or visitor");

  const data = { name: pickString(body.name), type };
  for (const field of type === "staff" ? STAFF_FIELDS : VISITOR_FIELDS) {
    const value = pickString(body[field]);
    if (value) data[field] = value;
  }
  if (data.expectedDate && !isDateString(data.expectedDate)) {
    throw httpError(400, "Expected date must be in YYYY-MM-DD format");
  }

  if (req.file) {
    data.photoData = req.file.buffer;
    data.photoType = req.file.mimetype;
    data.hasPhoto = true;
  }

  const person = await Person.create(data);
  res.status(201).json(person);
});

async function setStatus(req, res, status) {
  const person = await Person.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!person) throw httpError(404, "Person not found");
  res.json(person);
}

// PATCH /api/people/:id/revoke
router.patch("/:id/revoke", validObjectId, (req, res) => setStatus(req, res, "revoked"));

// PATCH /api/people/:id/activate
router.patch("/:id/activate", validObjectId, (req, res) => setStatus(req, res, "active"));

// DELETE /api/people/:id (access logs are kept as an audit trail)
router.delete("/:id", validObjectId, async (req, res) => {
  const person = await Person.findByIdAndDelete(req.params.id);
  if (!person) throw httpError(404, "Person not found");
  res.json({ message: "Deleted" });
});

export default router;
