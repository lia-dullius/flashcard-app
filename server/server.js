const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Flashcard = require("./models/Flashcard");

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "Pensieve Cards API is running." });
});

/*
  GET all flashcards
*/
app.get("/api/flashcards", async (req, res) => {
  try {
    const flashcards = await Flashcard.find().sort({ createdAt: -1 });
    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch flashcards." });
  }
});

/*
  POST create a new flashcard
*/
app.post("/api/flashcards", async (req, res) => {
  try {
    const { category, question, answer } = req.body;

    if (!category || !question || !answer) {
      return res.status(400).json({
        message: "Category, question and answer are required."
      });
    }

    const newFlashcard = new Flashcard({
      category,
      question,
      answer
    });

    const savedFlashcard = await newFlashcard.save();
    res.status(201).json(savedFlashcard);
  } catch (error) {
    res.status(500).json({ message: "Failed to create flashcard." });
  }
});

/*
  PUT update an existing flashcard
*/
app.put("/api/flashcards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { category, question, answer } = req.body;

    if (!category || !question || !answer) {
      return res.status(400).json({
        message: "Category, question and answer are required."
      });
    }

    const updatedFlashcard = await Flashcard.findByIdAndUpdate(
      id,
      { category, question, answer },
      { new: true, runValidators: true }
    );

    if (!updatedFlashcard) {
      return res.status(404).json({ message: "Flashcard not found." });
    }

    res.json(updatedFlashcard);
  } catch (error) {
    res.status(500).json({ message: "Failed to update flashcard." });
  }
});

/*
  DELETE a flashcard
*/
app.delete("/api/flashcards/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFlashcard = await Flashcard.findByIdAndDelete(id);

    if (!deletedFlashcard) {
      return res.status(404).json({ message: "Flashcard not found." });
    }

    res.json({ message: "Flashcard deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete flashcard." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});