const mongoose = require("mongoose");

const studyHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    category: {
      type: String,
      required: true,
      default: "all"
    },
    totalCards: {
      type: Number,
      required: true
    },
    completedCards: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["completed", "ended"],
      required: true
    },
    startedAt: {
      type: Date,
      required: true
    },
    endedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("StudyHistory", studyHistorySchema);