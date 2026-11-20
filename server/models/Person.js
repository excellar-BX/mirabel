import crypto from "node:crypto";
import mongoose from "mongoose";

const PersonSchema = new mongoose.Schema(
  {
    idNumber: {
      type: String,
      unique: true,
      default: () => "SCH-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: ["staff", "visitor"], required: true, index: true },

    // Photo is stored in MongoDB so the app works on read-only/serverless hosts.
    photoData: { type: Buffer, select: false },
    photoType: { type: String, select: false },
    hasPhoto: { type: Boolean, default: false },

    // Staff fields
    role: { type: String, trim: true, maxlength: 120 },
    department: { type: String, trim: true, maxlength: 120 },

    // Visitor fields
    purpose: { type: String, trim: true, maxlength: 300 },
    hostName: { type: String, trim: true, maxlength: 120 },
    expectedDate: { type: Date },

    status: { type: String, enum: ["active", "revoked"], default: "active", index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.photoData;
        delete ret.photoType;
        delete ret.photo; // legacy filename field from disk uploads
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.model("Person", PersonSchema);
