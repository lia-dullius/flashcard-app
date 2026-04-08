console.log("JavaScript connected");

document.addEventListener("DOMContentLoaded", () => {
  /*
    =========================================
    DOM ELEMENTS
    =========================================
  */
  const cardsContainer = document.getElementById("cards-container");
  const cardCount = document.getElementById("card-count");
  const searchInput = document.getElementById("search-input");
  const libraryTags = document.getElementById("library-tags");

  const form = document.getElementById("flashcard-form");
  const formTitle = document.querySelector(".form-section h2");
  const formSubmitButton = form.querySelector('button[type="submit"]');

  const studyTags = document.getElementById("study-tags");
  const studyToggleButton = document.getElementById("study-toggle-btn");
  const sessionStatus = document.getElementById("session-status");
  const sessionNote = document.getElementById("session-note");
  const studyCard = document.getElementById("study-card");
  const sessionProgress = document.getElementById("session-progress");
  const studyContent = document.getElementById("study-content");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  /*
    =========================================
    CANCEL EDITION BUTTON
    =========================================
  */
  const cancelEditButton = document.createElement("button");
  cancelEditButton.type = "button";
  cancelEditButton.className = "secondary-btn hidden";
  cancelEditButton.textContent = "Cancel edit";
  form.appendChild(cancelEditButton);

  /*
    =========================================
    FEEDBACK TOAST
    =========================================
  */
  const toast = document.createElement("div");
  toast.id = "feedback-toast";
  toast.className = "feedback-toast";
  document.body.appendChild(toast);

  /*
    =========================================
    API SETTING
    =========================================
  */
  const API_BASE_URL = "http://localhost:3000/api/flashcards";

  /*
    =========================================
    INITIAL DATA
    =========================================
  */
  let flashcards = [];

  /*
    =========================================
    STATE
    =========================================
  */
  const state = {
    library: {
      selectedCategory: "all",
      searchTerm: "",
      revealedCardIds: new Set()
    },
    study: {
      selectedCategory: "all",
      isActive: false,
      completedSession: false,
      sessionCards: [],
      totalCards: 0,
      completedCount: 0,
      revealedCurrent: false
    },
    editingCardId: null
  };

  /*
    =========================================
    CATEGORY THEMES
    =========================================
  */
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

  /*
    =========================================
    CATEGORY ALIASES
    =========================================
  */
  const categoryAliases = {
    "history of magic": "history",
    "study of ancient runes": "runes",
    "defence against the dark arts": "defense against the dark arts"
  };

  /*
    =========================================
    FUCNTIONS
    =========================================
  */
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

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

  function formatCardCount(visibleCount, totalCount) {
    if (visibleCount === totalCount) {
      return `${totalCount} ${totalCount === 1 ? "card" : "cards"}`;
    }

    return `${visibleCount} of ${totalCount} cards`;
  }

  function getFilteredCards() {
    return flashcards.filter((card) => {
      const matchesCategory =
        state.library.selectedCategory === "all" ||
        card.category === state.library.selectedCategory;

      const search = state.library.searchTerm.trim().toLowerCase();
      const categoryLabel = getCategoryTheme(card.category).label.toLowerCase();

      const matchesSearch =
        search === "" ||
        card.question.toLowerCase().includes(search) ||
        card.answer.toLowerCase().includes(search) ||
        categoryLabel.includes(search);

      return matchesCategory && matchesSearch;
    });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timeoutId);

    showToast.timeoutId = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  async function loadFlashcards() {
    try {
      const response = await fetch(API_BASE_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch flashcards.");
      }

      const data = await response.json();

      flashcards = data.map((card) => ({
        id: card._id,
        category: card.category,
        question: card.question,
        answer: card.answer
      }));

      renderUI();
    } catch (error) {
      console.error("Error loading flashcards:", error);
      showToast("Could not load flashcards from the database.");
      renderUI();
    }
  }

  function shuffleArray(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
    }

    return copy;
  }

  function resetFormToAddMode() {
    state.editingCardId = null;
    formTitle.textContent = "Create a new card";
    formSubmitButton.textContent = "Add card";
    cancelEditButton.classList.add("hidden");
    form.reset();
  }

  function setFormToEditMode(card) {
    state.editingCardId = card.id;
    formTitle.textContent = "Edit card";
    formSubmitButton.textContent = "Save changes";
    cancelEditButton.classList.remove("hidden");

    document.getElementById("category").value = getCategoryTheme(card.category).label;
    document.getElementById("question").value = card.question;
    document.getElementById("answer").value = card.answer;

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function ensureValidSelectedCategory() {
    const existingCategories = getAllCategories();

    if (
      state.library.selectedCategory !== "all" &&
      !existingCategories.includes(state.library.selectedCategory)
    ) {
      state.library.selectedCategory = "all";
    }

    if (
      !state.study.isActive &&
      state.study.selectedCategory !== "all" &&
      !existingCategories.includes(state.study.selectedCategory)
    ) {
      state.study.selectedCategory = "all";
    }
  }

  function closeAllMenus() {
    document.querySelectorAll(".card-menu.open").forEach((menu) => {
      menu.classList.remove("open");
    });
  }

  function getStudyPool() {
    const baseCards =
      state.study.selectedCategory === "all"
        ? flashcards
        : flashcards.filter((card) => card.category === state.study.selectedCategory);

    return baseCards.map((card) => ({
      ...card
    }));
  }

  function getCurrentStudyCard() {
    return state.study.sessionCards[0] || null;
  }

  function startStudySession() {
  const pool = getStudyPool();

  console.log("startStudySession clicked");
  console.log("selected category:", state.study.selectedCategory);
  console.log("pool:", pool);

  if (pool.length === 0) {
    showToast("There are no cards available for this category.");
    return;
  }

  state.study.isActive = true;
  state.study.completedSession = false;
  state.study.sessionCards = shuffleArray(pool);
  state.study.totalCards = pool.length;
  state.study.completedCount = 0;
  state.study.revealedCurrent = false;

  console.log("sessionCards after shuffle:", state.study.sessionCards);
  console.log("state.study.isActive:", state.study.isActive);

  renderStudyRoom();
  showToast("Study session started.");
}

  function endStudySession(showToastMessage = true) {
    state.study.isActive = false;
    state.study.completedSession = false;
    state.study.sessionCards = [];
    state.study.totalCards = 0;
    state.study.completedCount = 0;
    state.study.revealedCurrent = false;

    renderStudyRoom();
   
    console.log("renderStudyRoom running", {
    isActive: state.study.isActive,
    completedSession: state.study.completedSession,
    sessionCards: state.study.sessionCards,
    totalCards: state.study.totalCards
    });
    
    if (showToastMessage) {
      showToast("Study session ended.");
    }
  }

  function completeStudySession() {
    state.study.isActive = false;
    state.study.completedSession = true;
    state.study.sessionCards = [];
    state.study.revealedCurrent = false;

    renderStudyRoom();
    showToast("Session complete.");
  }

  /*
    =========================================
    TAGS RENDER IN LIBRARY
    =========================================
  */
  function renderLibraryTags() {
    const categories = getAllCategories();

    const allButtonHtml = `
      <button
        type="button"
        class="tag tag-all ${state.library.selectedCategory === "all" ? "active" : ""}"
        data-category="all"
      >
        All
      </button>
    `;

    const categoryButtonsHtml = categories
      .map((category) => {
        const theme = getCategoryTheme(category);
        const isActive = state.library.selectedCategory === category;

        return `
          <button
            type="button"
            class="tag dynamic-tag ${isActive ? "active" : ""}"
            data-category="${escapeHtml(category)}"
            style="background: ${theme.tagBg}; color: ${theme.textColor};"
          >
            ${escapeHtml(theme.label)}
          </button>
        `;
      })
      .join("");

    libraryTags.innerHTML = allButtonHtml + categoryButtonsHtml;
  }

  /*
    =========================================
    TAGS RENDER IN STUDY ROOM
    =========================================
  */
  function renderStudyTags() {
    const categories = getAllCategories();
    const isLocked = state.study.isActive;

    const allButtonHtml = `
      <button
        type="button"
        class="tag tag-all ${state.study.selectedCategory === "all" ? "active" : ""}"
        data-category="all"
        ${isLocked ? "disabled" : ""}
      >
        All
      </button>
    `;

    const categoryButtonsHtml = categories
      .map((category) => {
        const theme = getCategoryTheme(category);
        const isActive = state.study.selectedCategory === category;

        return `
          <button
            type="button"
            class="tag dynamic-tag ${isActive ? "active" : ""}"
            data-category="${escapeHtml(category)}"
            style="background: ${theme.tagBg}; color: ${theme.textColor};"
            ${isLocked ? "disabled" : ""}
          >
            ${escapeHtml(theme.label)}
          </button>
        `;
      })
      .join("");

    studyTags.innerHTML = allButtonHtml + categoryButtonsHtml;
  }

  /*
    =========================================
    LIBRARY RENDER
    =========================================
  */
  function renderLibrary() {
    ensureValidSelectedCategory();

    const filteredCards = getFilteredCards();
    cardCount.textContent = formatCardCount(filteredCards.length, flashcards.length);

    if (filteredCards.length === 0) {
      cardsContainer.innerHTML = `
        <article class="card flashcard empty-state-card">
          <div class="empty-library-state">
            <h3>No cards found</h3>
            <p>Try a different category or search term.</p>
          </div>
        </article>
      `;
      return;
    }

    cardsContainer.innerHTML = filteredCards
      .map((card) => {
        const theme = getCategoryTheme(card.category);
        const isRevealed = state.library.revealedCardIds.has(card.id);

        return `
          <article
            class="flashcard card"
            data-category="${escapeHtml(card.category)}"
            data-id="${card.id}"
            style="background: ${theme.cardBg}; border-color: ${theme.cardBorder};"
          >
            <div class="card-top">
              <p
                class="card-category"
                style="color: ${theme.textColor};"
              >
                ${escapeHtml(theme.label)}
              </p>

              <div class="card-menu">
                <button
                  class="menu-btn"
                  type="button"
                  aria-label="Open card menu"
                  data-id="${card.id}"
                >
                  ⋯
                </button>
                <div class="menu-dropdown">
                  <button type="button" class="edit-btn" data-id="${card.id}">Edit</button>
                  <button type="button" class="delete-btn" data-id="${card.id}">Delete</button>
                </div>
              </div>
            </div>

            <h3>${escapeHtml(card.question)}</h3>

            <p class="answer ${isRevealed ? "" : "hidden"}">
              <span class="answer-check" aria-hidden="true">✅</span>
              <span>${escapeHtml(card.answer)}</span>
            </p>

            <div class="card-actions">
              <button
                class="reveal-btn"
                type="button"
                data-id="${card.id}"
              >
                ${isRevealed ? "Hide answer" : "Reveal answer"}
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  /*
    =========================================
    RENDER IN STUDY ROOM
    =========================================
  */
  function renderStudyRoom() {
  const selectedTheme =
    state.study.selectedCategory === "all"
      ? null
      : getCategoryTheme(state.study.selectedCategory);

  const selectedLabel =
    state.study.selectedCategory === "all"
      ? "All cards"
      : selectedTheme.label;

  prevBtn.style.display = "none";
  nextBtn.style.display = "block";

  if (state.study.completedSession) {
    studyCard.classList.add("study-empty");
    studyCard.style.background = "";
    studyCard.style.borderColor = "";

    sessionProgress.textContent = `${state.study.completedCount} of ${state.study.totalCards} cards reviewed`;
    sessionStatus.textContent = "";
    sessionNote.textContent = "Start a new session whenever you want to review these cards again.";

    studyToggleButton.textContent = "Start shuffled session";
    studyToggleButton.disabled = getStudyPool().length === 0;

    studyContent.innerHTML = `
      <p class="study-empty-title">💪 You completed this study session</p>
      <p class="study-empty-text">
        All cards were reviewed and removed from the session after use.
      </p>
    `;

    nextBtn.textContent = "Next";
    nextBtn.disabled = true;
    return;
  }

  if (!state.study.isActive) {
    const availableCardsCount = getStudyPool().length;

    studyCard.classList.add("study-empty");
    studyCard.style.background = "";
    studyCard.style.borderColor = "";

    sessionProgress.textContent = "0 of 0 cards";
    sessionStatus.textContent = "";
    sessionNote.textContent =
      "Changes made to the library during a study session will only appear when a new session starts.";

    studyToggleButton.textContent = "Start shuffled session";
    studyToggleButton.disabled = availableCardsCount === 0;

    if (availableCardsCount === 0) {
      studyContent.innerHTML = `
        <p class="study-empty-title">No cards yet 📭</p>
        <p class="study-empty-text">
          Add your first card to start studying.
        </p>
      `;
    } else {
      studyContent.innerHTML = `
        <p class="study-empty-title">Ready to study?</p>
        <p class="study-empty-text">
          Choose a category and study your cards in random order.
        </p>
      `;
    }

    nextBtn.textContent = "Next";
    nextBtn.disabled = true;
    return;
  }

  const currentCard = getCurrentStudyCard();

  if (!currentCard) {
    completeStudySession();
    return;
  }

  const currentTheme = getCategoryTheme(currentCard.category);

  studyCard.classList.remove("study-empty");
  studyCard.style.background = currentTheme.cardBg;
  studyCard.style.borderColor = currentTheme.cardBorder;

  sessionProgress.textContent = `${state.study.completedCount + 1} of ${state.study.totalCards} cards`;
  sessionStatus.textContent = "";
  sessionNote.textContent =
    "Reveal the answer, then move to the next card. Used cards are removed from this session.";

  studyToggleButton.textContent = "End session";
  studyToggleButton.disabled = false;

  studyContent.innerHTML = `
    <p class="study-category-label" style="color: ${currentTheme.textColor};">
      ${escapeHtml(currentTheme.label)}
    </p>

    <h3 class="study-question">
      ${escapeHtml(currentCard.question)}
    </h3>

    ${
      state.study.revealedCurrent
        ? `
          <p class="answer study-answer">
            <span class="answer-check" aria-hidden="true">✅</span>
            <span>${escapeHtml(currentCard.answer)}</span>
          </p>
        `
        : `
          <button
            type="button"
            class="reveal-btn study-reveal-btn"
            id="study-reveal-btn"
          >
            Reveal answer
          </button>
        `
    }
  `;

  const isLastCard = state.study.sessionCards.length === 1;

  if (isLastCard && state.study.revealedCurrent) {
    nextBtn.textContent = "Finish session";
  } else {
    nextBtn.textContent = "Next";
  }

  nextBtn.disabled = !state.study.revealedCurrent;
}

  function renderUI() {
    renderLibraryTags();
    renderStudyTags();
    renderLibrary();
    renderStudyRoom();
  }

  /*
    =========================================
    LIVRARY TAGS - EVENTSY
    =========================================
  */
  libraryTags.addEventListener("click", (event) => {
    const clickedTag = event.target.closest(".tag");
    if (!clickedTag) return;

    state.library.selectedCategory = clickedTag.dataset.category;
    renderLibraryTags();
    renderLibrary();
  });

  /*
    =========================================
    STUDY ROOM TAGS - EVENTS
    =========================================
  */
  studyTags.addEventListener("click", (event) => {
    const clickedTag = event.target.closest(".tag");
    if (!clickedTag || state.study.isActive) return;

    state.study.selectedCategory = clickedTag.dataset.category;
    state.study.completedSession = false;
    renderStudyTags();
    renderStudyRoom();
  });

  /*
    =========================================
    SEARCH
    =========================================
  */
  searchInput.addEventListener("input", (event) => {
    state.library.searchTerm = event.target.value;
    renderLibrary();
  });

  /*
    =========================================
    MENU + REVEAL + EDIT + DELETE
    =========================================
  */
  cardsContainer.addEventListener("click", async (event) => {
    const menuButton = event.target.closest(".menu-btn");
    const revealButton = event.target.closest(".reveal-btn");
    const editButton = event.target.closest(".edit-btn");
    const deleteButton = event.target.closest(".delete-btn");

    if (menuButton) {
      const currentMenu = menuButton.closest(".card-menu");
      const isAlreadyOpen = currentMenu.classList.contains("open");

      closeAllMenus();

      if (!isAlreadyOpen) {
        currentMenu.classList.add("open");
      }

      return;
    }

    if (revealButton) {
      const cardId = revealButton.dataset.id;

      if (state.library.revealedCardIds.has(cardId)) {
        state.library.revealedCardIds.delete(cardId);
      } else {
        state.library.revealedCardIds.add(cardId);
      }

      renderLibrary();
      return;
    }

    if (editButton) {
      const cardId = editButton.dataset.id;
      const cardToEdit = flashcards.find((card) => card.id === cardId);

      if (!cardToEdit) return;

      closeAllMenus();
      setFormToEditMode(cardToEdit);
      showToast("Editing card. Update the fields and save your changes.");
      return;
    }

    if (deleteButton) {
      const cardId = deleteButton.dataset.id;
      const confirmed = window.confirm("Are you sure you want to delete this card?");

      if (!confirmed) return;

      try {
        const response = await fetch(`${API_BASE_URL}/${cardId}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          throw new Error("Failed to delete flashcard.");
        }

        state.library.revealedCardIds.delete(cardId);

        if (state.editingCardId === cardId) {
          resetFormToAddMode();
        }

        closeAllMenus();
        await loadFlashcards();
        showToast("Card deleted successfully.");
      } catch (error) {
        console.error("Delete error:", error);
        showToast("Could not delete the card.");
      }
    }
  });

  /*
    =========================================
    CLOSE MENU CLICKING OUTSIDE
    =========================================
  */
  document.addEventListener("click", (event) => {
    const clickedInsideMenu = event.target.closest(".card-menu");
    if (!clickedInsideMenu) {
      closeAllMenus();
    }
  });

  /*
    =========================================
    ADD / UPDATE
    =========================================
  */
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const categoryInput = document.getElementById("category").value.trim();
    const questionInput = document.getElementById("question").value.trim();
    const answerInput = document.getElementById("answer").value.trim();

    if (!categoryInput || !questionInput || !answerInput) {
      alert("Please fill in all fields.");
      return;
    }

    const normalizedCategory = normalizeCategory(categoryInput);

    try {
      if (state.editingCardId !== null) {
        const response = await fetch(`${API_BASE_URL}/${state.editingCardId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            category: normalizedCategory,
            question: questionInput,
            answer: answerInput
          })
        });

        if (!response.ok) {
          throw new Error("Failed to update flashcard.");
        }

        resetFormToAddMode();
        await loadFlashcards();
        showToast("Card updated successfully.");
        return;
      }

      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: normalizedCategory,
          question: questionInput,
          answer: answerInput
        })
      });

      if (!response.ok) {
        throw new Error("Failed to create flashcard.");
      }

      resetFormToAddMode();
      await loadFlashcards();
      showToast("Card added successfully.");
    } catch (error) {
      console.error("Submit error:", error);
      showToast("Could not save the card.");
    }
  });

  /*
    =========================================
    CANCEL EDITTING
    =========================================
  */
  cancelEditButton.addEventListener("click", () => {
    resetFormToAddMode();
    showToast("Edit cancelled.");
  });

  /*
    =========================================
    START / END SESSION
    =========================================
  */
  studyToggleButton.addEventListener("click", () => {
    if (state.study.isActive) {
      endStudySession();
      return;
    }

    startStudySession();
  });

  /*
    =========================================
    NEXT CARD
    =========================================
  */
  nextBtn.addEventListener("click", () => {
    if (!state.study.isActive) return;
    if (!state.study.revealedCurrent) return;

    state.study.sessionCards.shift();
    state.study.completedCount += 1;
    state.study.revealedCurrent = false;

    if (state.study.sessionCards.length === 0) {
      completeStudySession();
      return;
    }

    renderStudyRoom();
  });

  /*
    =========================================
    REVEAL ANSWER ON STUDY ROOM
    =========================================
  */
  studyContent.addEventListener("click", (event) => {
    const revealButton = event.target.closest("#study-reveal-btn");
    if (!revealButton || !state.study.isActive) return;

    state.study.revealedCurrent = true;
    renderStudyRoom();
  });

  /*
    =========================================
    INITIAL RENDER
    =========================================
  */
  resetFormToAddMode();
  loadFlashcards();
});
