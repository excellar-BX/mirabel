const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
  {
    person: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Person",
      required: true,
    },
    checkInTime: { type: Date, default: Date.now },
    entryPoint: { type: String, default: "Main Gate", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", LogSchema);