const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Flashcard = require("./models/Flashcard");
const StudyHistory = require("./models/StudyHistory");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const { protect, adminOnly } = require("./middleware/authMiddleware");

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "Pensieve Cards API is running." });
});

/*
  GET all flashcards
*/
app.get("/api/flashcards", protect, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ user: req.user._id }).sort({
    createdAt: -1
    });

    res.json(flashcards);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch flashcards." });
  }
});

/*
  POST create a new flashcard
*/
app.post("/api/flashcards", protect, async (req, res) => {
  try {
    const { category, question, answer } = req.body;

    if (!category || !question || !answer) {
      return res.status(400).json({
        message: "Category, question and answer are required."
      });
    }

    const newFlashcard = new Flashcard({
      user: req.user._id,
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
app.put("/api/flashcards/:id", protect, async (req, res) => {
  try {
    const { category, question, answer } = req.body;

    const flashcard = await Flashcard.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!flashcard) {
      return res.status(404).json({
        message: "Flashcard not found or not owned by this user."
      });
    }

    flashcard.category = category;
    flashcard.question = question;
    flashcard.answer = answer;

    const updatedFlashcard = await flashcard.save();

    res.json(updatedFlashcard);
  } catch (error) {
    res.status(500).json({ message: "Failed to update flashcard." });
  }
});

/*
  DELETE a flashcard
*/
app.delete("/api/flashcards/:id", protect, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!flashcard) {
      return res.status(404).json({
        message: "Flashcard not found or not owned by this user."
      });
    }

    res.json({ message: "Flashcard deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete flashcard." });
  }
});

/*
  POST create a study history record
*/
app.post("/api/study-history", protect, async (req, res) => {
  try {
    const {
      category,
      totalCards,
      completedCards,
      status,
      startedAt
    } = req.body;

    if (!totalCards || completedCards === undefined || !status || !startedAt) {
      return res.status(400).json({
        message: "Study history requires totalCards, completedCards, status and startedAt."
      });
    }

    const historyRecord = new StudyHistory({
      user: req.user._id,
      category: category || "all",
      totalCards,
      completedCards,
      status,
      startedAt,
      endedAt: new Date()
    });

    const savedHistory = await historyRecord.save();

    res.status(201).json(savedHistory);
  } catch (error) {
    console.error("Study history save error:", error);
    res.status(500).json({
      message: "Failed to save study history."
    });
  }
});

/*
  GET study history for the logged-in user
*/
app.get("/api/study-history", protect, async (req, res) => {
  try {
    const history = await StudyHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(history);
  } catch (error) {
    console.error("Study history fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch study history."
    });
  }
});

/*
  GET admin overview
  Only admin users can access this route.
*/
app.get("/api/admin/overview", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    const flashcardCounts = await Flashcard.aggregate([
      {
        $match: {
          user: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$user",
          totalFlashcards: { $sum: 1 }
        }
      }
    ]);

    const historyCounts = await StudyHistory.aggregate([
      {
        $match: {
          user: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$user",
          totalStudySessions: { $sum: 1 }
        }
      }
    ]);

    const flashcardCountMap = {};
    flashcardCounts.forEach((item) => {
      flashcardCountMap[item._id.toString()] = item.totalFlashcards;
    });

    const historyCountMap = {};
    historyCounts.forEach((item) => {
      historyCountMap[item._id.toString()] = item.totalStudySessions;
    });

    const userSummaries = users.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      totalFlashcards: flashcardCountMap[user._id.toString()] || 0,
      totalStudySessions: historyCountMap[user._id.toString()] || 0
    }));

    res.json({
      totalUsers: users.length,
      totalFlashcards: flashcardCounts.reduce(
        (sum, item) => sum + item.totalFlashcards,
        0
      ),
      totalStudySessions: historyCounts.reduce(
        (sum, item) => sum + item.totalStudySessions,
        0
      ),
      users: userSummaries
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    res.status(500).json({
      message: "Failed to load admin overview."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});