import mongoose from "mongoose";

const LogSchema = new mongoose.Schema(
  {
    person: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true,
      index: true,
    },
    checkInTime: { type: Date, default: Date.now, index: true },
    entryPoint: { type: String, default: "Main Gate", trim: true, maxlength: 80 },
  },
  { timestamps: true }
);

export default mongoose.model("Log", LogSchema);
