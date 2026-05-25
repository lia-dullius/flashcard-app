const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const User = require("./models/User");
const Flashcard = require("./models/Flashcard");
const StudyHistory = require("./models/StudyHistory");

dotenv.config();

async function exportDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for export.");

    const exportFolder = path.join(__dirname, "..", "database");

    if (!fs.existsSync(exportFolder)) {
      fs.mkdirSync(exportFolder);
    }

    const users = await User.find().lean();
    const flashcards = await Flashcard.find().lean();
    const studyHistories = await StudyHistory.find().lean();

    const safeUsers = users.map((user) => ({
      ...user,
      password: user.password
        ? `[hashed password hidden - starts with ${user.password.slice(0, 7)}]`
        : null
    }));

    fs.writeFileSync(
      path.join(exportFolder, "users.json"),
      JSON.stringify(safeUsers, null, 2)
    );

    fs.writeFileSync(
      path.join(exportFolder, "flashcards.json"),
      JSON.stringify(flashcards, null, 2)
    );

    fs.writeFileSync(
      path.join(exportFolder, "studyhistories.json"),
      JSON.stringify(studyHistories, null, 2)
    );

    console.log("Database export completed.");
    console.log("Files saved in the database folder.");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Database export failed:", error);
    await mongoose.disconnect();
  }
}

exportDatabase();