import { useEffect, useState } from "react";
import api from "./services/api";
import AuthForm from "./components/AuthForm.jsx";
import "./style.css";

const categoryThemes = {
  charms: {
    label: "Charms",
    cardBg: "#e8f1ff",
    cardBorder: "#cfdcf6",
    textColor: "#3f6fc7",
    tagBg: "rgba(232, 241, 255, 0.95)"
  },
  potions: {
    label: "Potions",
    cardBg: "#f3eadf",
    cardBorder: "#e4d4c1",
    textColor: "#8a6442",
    tagBg: "rgba(243, 234, 223, 0.95)"
  },
  history: {
    label: "History of Magic",
    cardBg: "#fff4bf",
    cardBorder: "#f0e1a2",
    textColor: "#a38316",
    tagBg: "rgba(255, 244, 191, 0.95)"
  },
  transfiguration: {
    label: "Transfiguration",
    cardBg: "#f7e6ff",
    cardBorder: "#e7c9f4",
    textColor: "#8d49a9",
    tagBg: "rgba(247, 230, 255, 0.95)"
  },
  herbology: {
    label: "Herbology",
    cardBg: "#e5f5e8",
    cardBorder: "#c8e6cd",
    textColor: "#3d7e52",
    tagBg: "rgba(229, 245, 232, 0.95)"
  },
  "defense against the dark arts": {
    label: "Defense Against the Dark Arts",
    cardBg: "#ffe5e5",
    cardBorder: "#f2caca",
    textColor: "#b34b4b",
    tagBg: "rgba(255, 229, 229, 0.95)"
  },
  astronomy: {
    label: "Astronomy",
    cardBg: "#eae8ff",
    cardBorder: "#cfd1fb",
    textColor: "#5351b8",
    tagBg: "rgba(232, 236, 255, 0.95)"
  },
  divination: {
    label: "Divination",
    cardBg: "#fff5e7",
    cardBorder: "#f5e0cb",
    textColor: "#b27d5c",
    tagBg: "rgba(255, 243, 231, 0.95)"
  },
  arithmancy: {
    label: "Arithmancy",
    cardBg: "#eefffb",
    cardBorder: "#8dfbcb",
    textColor: "#27bc8d",
    tagBg: "rgba(238, 247, 255, 0.95)"
  },
  runes: {
    label: "Study of Ancient Runes",
    cardBg: "#f9dcf8",
    cardBorder: "#edbbeb",
    textColor: "#9d4083",
    tagBg: "rgba(247, 220, 249, 0.95)"
  },
  "care of magical creatures": {
    label: "Care of Magical Creatures",
    cardBg: "#edf5e2",
    cardBorder: "#d5e5bf",
    textColor: "#5e8640",
    tagBg: "rgba(237, 245, 226, 0.95)"
  }
};

const fallbackTheme = {
  label: null,
  cardBg: "#f4efff",
  cardBorder: "#ddd3ef",
  textColor: "#7d6bb8",
  tagBg: "rgb(247, 246, 251)"
};

const categoryAliases = {
  "history of magic": "history",
  "study of ancient runes": "runes",
  "defence against the dark arts": "defense against the dark arts"
};

function normalizeCategory(category) {
  const normalized = category.toLowerCase().trim().replace(/\s+/g, " ");
  return categoryAliases[normalized] || normalized;
}

function formatCategoryLabel(category) {
  return category
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getCategoryTheme(category) {
  const normalizedCategory = normalizeCategory(category);

  if (categoryThemes[normalizedCategory]) {
    return categoryThemes[normalizedCategory];
  }

  return {
    ...fallbackTheme,
    label: formatCategoryLabel(normalizedCategory)
  };
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("pensieveUser");
    return savedUser ? JSON.parse(savedUser) : null;
  }); 

  const [flashcards, setFlashcards] = useState([]);
  const [studyHistory, setStudyHistory] = useState([]);
  const [adminOverview, setAdminOverview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState("all");
  const [selectedStudyCategory, setSelectedStudyCategory] = useState("all");
  const [revealedCardIds, setRevealedCardIds] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingCardId, setEditingCardId] = useState(null);
  const [toast, setToast] = useState("");

  const [studySession, setStudySession] = useState({
  isActive: false,
  completed: false,
  cards: [],
  totalCards: 0,
  completedCount: 0,
  revealedCurrent: false,
  startedAt: null
});

  const [formData, setFormData] = useState({
    category: "",
    question: "",
    answer: ""
  });

async function loadFlashcards() {
  try {
    const response = await api.get("/flashcards");
    setFlashcards(response.data);
  } catch (error) {
    console.error("Error loading flashcards:", error);
    showToast("Could not load flashcards from the database.");
  }
}

async function loadStudyHistory() {
  try {
    const response = await api.get("/study-history");
    setStudyHistory(response.data);
  } catch (error) {
    console.error("Error loading study history:", error);
    showToast("Could not load study history.");
  }
}
async function loadAdminOverview() {
  try {
    const response = await api.get("/admin/overview");
    setAdminOverview(response.data);
  } catch (error) {
    console.error("Error loading admin overview:", error);
    showToast("Could not load admin dashboard.");
  }
}
async function saveStudyHistory(status, completedCards) {
  try {
    await api.post("/study-history", {
      category: selectedStudyCategory,
      totalCards: studySession.totalCards,
      completedCards,
      status,
      startedAt: studySession.startedAt
    });

    await loadStudyHistory();
  } catch (error) {
    console.error("Error saving study history:", error);
    showToast("Could not save this study session to history.");
  }
}
  useEffect(() => {
    if (currentUser) {
      loadFlashcards();
      loadStudyHistory();

      if (currentUser.role === "admin") {
        loadAdminOverview();
      } else {
        setAdminOverview(null);
      }
    } else {
      setFlashcards([]);
      setStudyHistory([]);
      setAdminOverview(null);
    }
  }, [currentUser]);

  function showToast(message) {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2200);
  }

  function getAllCategories() {
    const categories = [...new Set(flashcards.map((card) => card.category))];

    const preferredOrder = [
      "charms",
      "history",
      "potions",
      "transfiguration",
      "herbology",
      "defense against the dark arts",
      "astronomy",
      "divination",
      "arithmancy",
      "runes",
      "care of magical creatures"
    ];

    return categories.sort((a, b) => {
      const indexA = preferredOrder.indexOf(a);
      const indexB = preferredOrder.indexOf(b);

      const aKnown = indexA !== -1;
      const bKnown = indexB !== -1;

      if (aKnown && bKnown) return indexA - indexB;
      if (aKnown) return -1;
      if (bKnown) return 1;

      return a.localeCompare(b);
    });
  }

  const categories = getAllCategories();

  const filteredCards = flashcards.filter((card) => {
    const matchesCategory =
      selectedLibraryCategory === "all" ||
      card.category === selectedLibraryCategory;

    const search = searchTerm.trim().toLowerCase();
    const categoryLabel = getCategoryTheme(card.category).label.toLowerCase();

    const matchesSearch =
      search === "" ||
      card.question.toLowerCase().includes(search) ||
      card.answer.toLowerCase().includes(search) ||
      categoryLabel.includes(search);

    return matchesCategory && matchesSearch;
  });

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  }

  function resetForm() {
    setEditingCardId(null);
    setFormData({
      category: "",
      question: "",
      answer: ""
    });
  }

  function startEditing(card) {
    setEditingCardId(card._id);
    setFormData({
      category: getCategoryTheme(card.category).label,
      question: card.question,
      answer: card.answer
    });
    setOpenMenuId(null);
    showToast("Editing card. Update the fields and save your changes.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formData.category || !formData.question || !formData.answer) {
      showToast("Please fill in all fields.");
      return;
    }

    const payload = {
      category: normalizeCategory(formData.category),
      question: formData.question.trim(),
      answer: formData.answer.trim()
    };

    try {
      if (editingCardId) {
        await api.put(`/flashcards/${editingCardId}`, payload);
        showToast("Card updated successfully.");
      } else {
        await api.post("/flashcards", payload);
        showToast("Card added successfully.");
      }

      resetForm();
      await loadFlashcards();
    } catch (error) {
      console.error("Error saving flashcard:", error);
      showToast("Could not save the card.");
    }
  }

  async function deleteCard(cardId) {
    const confirmed = window.confirm("Are you sure you want to delete this card?");
    if (!confirmed) return;

    try {
      await api.delete(`/flashcards/${cardId}`);

      if (editingCardId === cardId) {
        resetForm();
      }

      setRevealedCardIds((currentIds) =>
        currentIds.filter((id) => id !== cardId)
      );

      setOpenMenuId(null);
      await loadFlashcards();
      showToast("Card deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);
      showToast("Could not delete the card.");
    }
  }

  function toggleReveal(cardId) {
    setRevealedCardIds((currentIds) => {
      if (currentIds.includes(cardId)) {
        return currentIds.filter((id) => id !== cardId);
      }

      return [...currentIds, cardId];
    });
  }
function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }

  return copy;
}

function getStudyPool() {
  if (selectedStudyCategory === "all") {
    return flashcards;
  }

  return flashcards.filter((card) => card.category === selectedStudyCategory);
}

function getCurrentStudyCard() {
  return studySession.cards[0] || null;
}
function formatDateTime(dateValue) {
  if (!dateValue) {
    return "Date not available";
  }

  return new Date(dateValue).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function formatDuration(startedAt, endedAt) {
  if (!startedAt || !endedAt) {
    return "Duration not available";
  }

  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const durationInSeconds = Math.max(0, Math.round((end - start) / 1000));

  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;

  if (minutes === 0) {
    return `${seconds} sec`;
  }

  return `${minutes} min ${seconds} sec`;
}

function formatAverageTime(startedAt, endedAt, completedCards) {
  if (!startedAt || !endedAt || completedCards === 0) {
    return null;
  }

  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const durationInSeconds = Math.max(0, Math.round((end - start) / 1000));
  const averageSeconds = Math.round(durationInSeconds / completedCards);

  if (averageSeconds < 60) {
    return `${averageSeconds} sec/card`;
  }

  const minutes = Math.floor(averageSeconds / 60);
  const seconds = averageSeconds % 60;

  return `${minutes} min ${seconds} sec/card`;
}
function startStudySession() {
  const pool = getStudyPool();

  if (pool.length === 0) {
    showToast("There are no cards available for this category.");
    return;
  }

  setStudySession({
  isActive: true,
  completed: false,
  cards: shuffleArray(pool),
  totalCards: pool.length,
  completedCount: 0,
  revealedCurrent: false,
  startedAt: new Date().toISOString()
});

  showToast("Study session started.");
}

async function endStudySession() {
  const confirmed = window.confirm(
    "Are you sure you want to end this study session? Your cards will remain saved, but the current session progress will be cleared."
  );

  if (!confirmed) return;

  if (studySession.completedCount > 0) {
    await saveStudyHistory("ended", studySession.completedCount);
  }

  setStudySession({
    isActive: false,
    completed: false,
    cards: [],
    totalCards: 0,
    completedCount: 0,
    revealedCurrent: false,
    startedAt: null
  });

  showToast("Study session ended.");
}

function revealStudyAnswer() {
  setStudySession((currentSession) => ({
    ...currentSession,
    revealedCurrent: true
  }));
}

async function goToNextStudyCard() {
  if (!studySession.isActive || !studySession.revealedCurrent) return;

  const remainingCards = studySession.cards.slice(1);
  const newCompletedCount = studySession.completedCount + 1;

  if (remainingCards.length === 0) {
    await saveStudyHistory("completed", newCompletedCount);

    setStudySession({
      isActive: false,
      completed: true,
      cards: [],
      totalCards: studySession.totalCards,
      completedCount: newCompletedCount,
      revealedCurrent: false,
      startedAt: null
    });

    showToast("Session complete and saved to history.");
    return;
  }

  setStudySession({
    ...studySession,
    cards: remainingCards,
    completedCount: newCompletedCount,
    revealedCurrent: false
  });
}

function handleLogout() {
  localStorage.removeItem("pensieveToken");
  localStorage.removeItem("pensieveUser");
  setCurrentUser(null);
  setFlashcards([]);
  showToast("Logged out successfully.");
}

if (!currentUser) {
  return <AuthForm onAuthSuccess={setCurrentUser} />;
}

const currentStudyCard = getCurrentStudyCard();
const availableStudyCards = getStudyPool();

  return (
    <main className="app" onClick={() => setOpenMenuId(null)}>
      <div className="user-bar">
        <p>
          Logged in as <strong>{currentUser.name}</strong> ({currentUser.role})
        </p>

        <button type="button" className="secondary-btn logout-btn" onClick={handleLogout}>
          Log out
        </button>
      </div>
    {currentUser.role === "admin" && adminOverview && (
      <section className="admin-dashboard">
        <div className="admin-dashboard-header">
          <div>
            <p className="eyebrow">Admin only</p>
            <h2>🛡️ Admin Dashboard</h2>
            <p className="admin-copy">
              Overview of users, flashcards and study activity across the app.
            </p>
          </div>
        </div>

        <div className="admin-summary-grid">
          <article className="admin-summary-card">
            <span>Total users</span>
            <strong>{adminOverview.totalUsers}</strong>
          </article>

          <article className="admin-summary-card">
            <span>Total flashcards</span>
            <strong>{adminOverview.totalFlashcards}</strong>
          </article>

          <article className="admin-summary-card">
            <span>Total study sessions</span>
            <strong>{adminOverview.totalStudySessions}</strong>
          </article>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Cards</th>
                <th>Study sessions</th>
              </tr>
            </thead>

            <tbody>
              {adminOverview.users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role === "admin" ? "🛡️ Admin" : "👤 User"}</td>
                  <td>{user.totalFlashcards}</td>
                  <td>{user.totalStudySessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )}
      <section className="top-layout">
        <header className="app-header">
          <div className="hero-copy">
            <p className="eyebrow">Prepare for your OWLs</p>
            <h1>🪄 Pensieve Cards</h1>
            <p className="hero-text">
              Build quick study cards and test your memory one spell at a time.
            </p>
          </div>
        </header>

        <section className="card form-section">
          <h2>{editingCardId ? "Edit card" : "Create a new card"}</h2>

          <form className="flashcard-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="category">Category</label>
              <p className="field-hint">Use a short label to group similar cards.</p>
              <input
                type="text"
                id="category"
                name="category"
                placeholder="e.g. Charms"
                value={formData.category}
                onChange={handleInputChange}
              />
            </div>

            <div className="field">
              <label htmlFor="question">Question</label>
              <p className="field-hint">Write one clear question per card.</p>
              <input
                type="text"
                id="question"
                name="question"
                placeholder="e.g. Which spell is used to disarm an opponent?"
                value={formData.question}
                onChange={handleInputChange}
              />
            </div>

            <div className="field">
              <label htmlFor="answer">Answer</label>
              <p className="field-hint">Keep the answer brief and easy to remember.</p>
              <textarea
                id="answer"
                name="answer"
                rows="4"
                placeholder="e.g. Expelliarmus"
                value={formData.answer}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <button className="primary-btn" type="submit">
              {editingCardId ? "Save changes" : "Add card"}
            </button>

            {editingCardId && (
              <button
                className="secondary-btn"
                type="button"
                onClick={resetForm}
              >
                Cancel edit
              </button>
            )}
          </form>
        </section>
      </section>

      <section className="study-room">
  <div className="study-layout">
    <div className="study-panel">
      <div className="study-room-header">
        <h2>🧑‍🎓 Study room</h2>
        <p className="study-copy">
          Choose a category and start a shuffled study session with one card at a time.
        </p>
      </div>

      <div className="study-tags">
        <button
          className={`tag tag-all ${selectedStudyCategory === "all" ? "active" : ""}`}
          type="button"
          disabled={studySession.isActive}
          onClick={() => setSelectedStudyCategory("all")}
        >
          All
        </button>

        {categories.map((category) => {
          const theme = getCategoryTheme(category);

          return (
            <button
              key={category}
              className={`tag ${selectedStudyCategory === category ? "active" : ""}`}
              type="button"
              disabled={studySession.isActive}
              onClick={() => setSelectedStudyCategory(category)}
              style={{
                background: theme.tagBg,
                color: theme.textColor
              }}
            >
              {theme.label}
            </button>
          );
        })}
      </div>

      <div className="study-session-meta">
        <p className="session-status">
          {studySession.isActive
            ? `${studySession.completedCount} completed`
            : ""}
        </p>
        <p className="session-note">
          {studySession.isActive
            ? "Reveal the answer, then move to the next card. Used cards are removed from this session."
            : "Changes made to the library during a study session will only appear when a new session starts."}
        </p>
      </div>

      <button
        type="button"
        className={`primary-btn study-start-btn ${
          studySession.isActive ? "danger-btn" : ""
        }`}
        disabled={!studySession.isActive && availableStudyCards.length === 0}
        onClick={studySession.isActive ? endStudySession : startStudySession}
      >
        {studySession.isActive ? "❌ End session" : "Start shuffled session"}
      </button>
    </div>

    <div className="study-card-shell">
      <article
        className={`study-card ${studySession.isActive ? "" : "study-empty"}`}
        style={
          currentStudyCard
            ? {
                background: getCategoryTheme(currentStudyCard.category).cardBg,
                borderColor: getCategoryTheme(currentStudyCard.category).cardBorder
              }
            : {}
        }
      >
        <p className="session-progress">
          {studySession.isActive
            ? `${studySession.completedCount + 1} of ${studySession.totalCards} cards`
            : studySession.completed
              ? `${studySession.completedCount} of ${studySession.totalCards} cards reviewed`
              : "0 of 0 cards"}
        </p>

        <div className="study-card-content">
          {studySession.completed ? (
            <>
              <p className="study-empty-title">💪 You completed this study session</p>
              <p className="study-empty-text">
                All cards were reviewed and removed from this session after use.
              </p>
            </>
          ) : studySession.isActive && currentStudyCard ? (
            <>
              <p
                className="study-category-label"
                style={{
                  color: getCategoryTheme(currentStudyCard.category).textColor
                }}
              >
                {getCategoryTheme(currentStudyCard.category).label}
              </p>

              <h3 className="study-question">{currentStudyCard.question}</h3>

              {studySession.revealedCurrent ? (
                <p className="answer study-answer">
                  <span className="answer-check" aria-hidden="true">✅</span>
                  <span>{currentStudyCard.answer}</span>
                </p>
              ) : (
                <button
                  type="button"
                  className="reveal-btn study-reveal-btn"
                  onClick={revealStudyAnswer}
                >
                  Reveal answer
                </button>
              )}
            </>
          ) : availableStudyCards.length === 0 ? (
            <>
              <p className="study-empty-title">No cards yet 📭</p>
              <p className="study-empty-text">
                Add your first card to start studying.
              </p>
            </>
          ) : (
            <>
              <p className="study-empty-title">Ready to study?</p>
              <p className="study-empty-text">
                Choose a category and study your cards in random order.
              </p>
            </>
          )}
        </div>

        <div className="study-card-actions">
          <button type="button" className="study-nav-btn" disabled>
            Previous
          </button>

          <button
            type="button"
            className="study-nav-btn"
            disabled={!studySession.isActive || !studySession.revealedCurrent}
            onClick={goToNextStudyCard}
          >
            {studySession.cards.length === 1 && studySession.revealedCurrent
              ? "Finish session"
              : "Next"}
          </button>
        </div>
      </article>
    </div>
  </div>
    <section className="learning-history study-history-panel">
    <div className="learning-history-header">
      <div>
        <h2>📜 Learning history</h2>
        <p className="library-copy">
          Review your most recent study sessions.
        </p>
      </div>
    </div>

    {studyHistory.length === 0 ? (
      <p className="history-empty">
        No study sessions recorded yet. Complete a session to start building your history.
      </p>
    ) : (
        // tabela aqui
      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Status</th>
              <th>Cards</th>
              <th>Total duration</th>
              <th>Avg. sec/card</th>
            </tr>
          </thead>

          <tbody>
            {studyHistory.map((session) => {
              const theme =
                session.category === "all"
                  ? null
                  : getCategoryTheme(session.category);

              const averageTime = formatAverageTime(
                session.startedAt,
                session.endedAt,
                session.completedCards
              );

              return (
                <tr key={session._id}>
                  <td>{formatDateTime(session.createdAt)}</td>

                  <td>
                    {session.category === "all" ? "All categories" : theme.label}
                  </td>

                  <td>
                    {session.status === "completed" ? "✅ Completed" : "🖐️ Ended early"}
                  </td>

                  <td>
                    {session.completedCards}/{session.totalCards}
                  </td>

                  <td>
                    {formatDuration(session.startedAt, session.endedAt)}
                  </td>

                  <td>
                    {averageTime || "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </section>
</section>

      <section className="library-header">
        <div>
          <h2>📚 Cards library</h2>
          <p className="library-copy">Browse, filter and review your saved cards.</p>
        </div>

        <div className="library-actions">
          <p className="card-count">
            {filteredCards.length === flashcards.length
              ? `${flashcards.length} cards`
              : `${filteredCards.length} of ${flashcards.length} cards`}
          </p>
        </div>
      </section>

      <section className="toolbar">
        <input
          type="text"
          placeholder="Search cards"
          aria-label="Search cards"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <div className="tag-filters">
          <button
            className={`tag tag-all ${selectedLibraryCategory === "all" ? "active" : ""}`}
            type="button"
            onClick={() => setSelectedLibraryCategory("all")}
          >
            All
          </button>

          {categories.map((category) => {
            const theme = getCategoryTheme(category);

            return (
              <button
                key={category}
                className={`tag ${selectedLibraryCategory === category ? "active" : ""}`}
                type="button"
                onClick={() => setSelectedLibraryCategory(category)}
                style={{
                  background: theme.tagBg,
                  color: theme.textColor
                }}
              >
                {theme.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="cards-grid">
        {filteredCards.length === 0 ? (
          <article className="card flashcard empty-state-card">
            <div className="empty-library-state">
              <h3>No cards found</h3>
              <p>Try a different category or search term.</p>
            </div>
          </article>
        ) : (
          filteredCards.map((card) => {
            const theme = getCategoryTheme(card.category);
            const isRevealed = revealedCardIds.includes(card._id);
            const isMenuOpen = openMenuId === card._id;

            return (
              <article
                className="flashcard card"
                key={card._id}
                style={{
                  background: theme.cardBg,
                  borderColor: theme.cardBorder
                }}
              >
                <div className="card-top">
                  <p
                    className="card-category"
                    style={{ color: theme.textColor }}
                  >
                    {theme.label}
                  </p>

                  <div
                    className={`card-menu ${isMenuOpen ? "open" : ""}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      className="menu-btn"
                      type="button"
                      aria-label="Open card menu"
                      onClick={() =>
                        setOpenMenuId(isMenuOpen ? null : card._id)
                      }
                    >
                      ⋯
                    </button>

                    <div className="menu-dropdown">
                      <button type="button" onClick={() => startEditing(card)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteCard(card._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <h3>{card.question}</h3>

                <p className={`answer ${isRevealed ? "" : "hidden"}`}>
                  <span className="answer-check" aria-hidden="true">✅</span>
                  <span>{card.answer}</span>
                </p>

                <div className="card-actions">
                  <button
                    className="reveal-btn"
                    type="button"
                    onClick={() => toggleReveal(card._id)}
                  >
                    {isRevealed ? "Hide answer" : "Reveal answer"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {toast && <div className="feedback-toast show">{toast}</div>}
    </main>
  );
}

export default App;