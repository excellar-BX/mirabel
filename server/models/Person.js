const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const PersonSchema = new mongoose.Schema(
  {
    idNumber: {
      type: String,
      unique: true,
      default: () => "SCH-" + uuidv4().slice(0, 8).toUpperCase(),
    },
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: null }, // filename stored in /uploads
    type: { type: String, enum: ["staff", "visitor"], required: true },

    // Staff fields
    role: { type: String, trim: true },
    department: { type: String, trim: true },

    // Visitor fields
    purpose: { type: String, trim: true },
    hostName: { type: String, trim: true },
    expectedDate: { type: Date },

    status: { type: String, enum: ["active", "revoked"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Person", PersonSchema);