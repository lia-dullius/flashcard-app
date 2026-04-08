# Pensieve Cards

Pensieve Cards is a single-page flashcard learning app inspired by the wizarding world of Hogwarts, from Harry Potter. It allows users to create, search, edit, delete, and study flashcards stored in a MongoDB database.

[▶️ Watch demo video](images/Demo.mp4)

## Problem this project solves

This website helps users organise and review study content in a quick and engaging way. Instead of relying on static notes, users can create short question-and-answer cards, group them by category, and review them through a focused study session in Study Room, or directly in the Cards Library.

## Technical stack

- **Frontend:** HTML, CSS and JavaScript
- **Backend:** Node.js and Express
- **Database:** MongoDB Atlas with Mongoose
- **Architecture:** Single-page application with dynamic DOM rendering
- **Styling:** Custom CSS with responsive layout and category-based visual themes
- **Routing:** Express API routes for CRUD operations
- **Deployment:** Not deployed (runs locally)

## Features

- Single-page application interface
- Create new flashcards
- Read flashcards from MongoDB
- Update existing flashcards
- Delete flashcards
- Search flashcards by keyword
- Dynamic category filters
- Study room with shuffled study session
- Reveal answer interaction
- Session-based card removal after use
- Empty states and feedback toasts
- Responsive design

## Study session logic

In the Study Room, flashcards are loaded into a shuffled study session snapshot.

When the user reveals the answer and clicks **Next**, the current card is removed from the active study session only.

This means:

- the card disappears from the current study session after use
- the card is **not deleted** from the database
- the card remains available in the Cards Library for future sessions

This behaviour was chosen to preserve user data while still satisfying the intended study flow.

## Folder structure

```text
pensieve-cards/
├── index.html
├── style.css
├── script.js
├── package.json
├── package-lock.json
├── README.md
├── database/
│   └── flashcards.json
├── images/
│   └── pensieve.png
└── server/
    ├── server.js
    └── models/
        └── Flashcard.js
```


## How to run the project

### 1. Install dependencies

```bash
npm install
```

### 2. Create a `.env` file

Create a `.env` file in the project root and add your MongoDB connection string:

```env
MONGODB_URI=your_mongodb_connection_string
```

### 3. Start the backend server

```bash
npm start
```

The server will run at:

```
http://localhost:3000
```

### 4. Open the frontend

Open `index.html` in your browser.

The frontend sends requests to:

```
http://localhost:3000/api/flashcards
```

⚠️ The backend must be running before opening the frontend.

---

## API endpoints

- `GET /api/flashcards` — fetch all flashcards  
- `POST /api/flashcards` — create a new flashcard  
- `PUT /api/flashcards/:id` — update a flashcard  
- `DELETE /api/flashcards/:id` — delete a flashcard  
- `GET /api/health` — check whether the API is running  

---

## Database export

A sample database export should be included in the project as:

```
database/flashcards.json
```

This file represents the structure of stored flashcards and can be used as reference or to re-import data if needed.

---

## Challenges overcome

One of the main challenges in this project was building a dynamic single-page interface without using a frontend framework. The application needed to manage different interface states, including searching, filtering, editing cards, and running study sessions, while keeping the experience smooth and coherent.

Another challenge was interpreting the requirement that a flashcard should “disappear after use” in a way that made sense for the product. The final solution removes cards from the current study session rather than deleting them from the database. This ensures that users can revisit the same content in future sessions, reflecting the behaviour of physical flashcards, which are set aside after use instead of being discarded.

I also encountered and resolved a bug caused by removing an HTML element that was still being referenced in JavaScript. Fixing this required aligning the DOM structure with the application logic, reinforcing the importance of consistency between markup and script.
