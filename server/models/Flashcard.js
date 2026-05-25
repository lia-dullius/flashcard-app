const mongoose = require("mongoose");

const flashcardSchema = new mongoose.Schema(
  {
    user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
    category: {
      type: String,
      required: true,
      trim: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Flashcard", flashcardSchema);
