# StudyMate — Full-Stack AI Study Assistant

**StudyMate** is an advanced learning dashboard that helps students organize notes, generate AI summaries, and test their retention with dynamically generated quizzes.

The project is structured into three main systems:
1. **Landing Page**: A pure HTML/CSS/JS glassmorphic marketing page introducing the application.
2. **Web Dashboard (Vite + React)**: A client-side dashboard for creating, searching, and viewing study notes, summaries, and quiz questions.
3. **Backend API (Express + MongoDB + OpenAI)**: The API engine processing note storage and integrating with OpenAI's `gpt-4o-mini` model to create summaries and test content.
4. **MCP Server (Model Context Protocol)**: An stdio tool interface allowing external AI models to interact with your notes database.

---

## 📁 Repository Directory Structure

```text
studymate/
├── landing/            # Part 1 — Pure HTML/CSS/JS Landing Page
│   ├── index.html
│   ├── style.css
│   └── script.js
├── client/             # Part 2 — React app (Vite)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── server/             # Part 3 & 4 — Express + MongoDB + OpenAI Integration
│   ├── server.js
│   ├── models/
│   │   └── Note.js
│   ├── .env
│   └── .env.example
├── mcp-server/         # Part 5 — Model Context Protocol Server
│   ├── index.js
│   └── package.json
└── README.md           # Part 6 — Setup & Documentation
```

---

## 🚀 Setup & Installation Instructions

Prerequisites: Ensure you have [Node.js](https://nodejs.org) (v18 or higher) and `npm` installed.

### 1. Database & API Backend (`server/`)

1. Navigate to the `server/` directory.
2. The environment configuration in `.env` is pre-configured with active database connections and OpenAI credentials:
   ```env
   MONGO_URI=mongodb+srv://aicapstone:i8EZaPVsAZK74H3P@cluster0.xkpdagp.mongodb.net/?appName=Cluster0
   OPENAI_API_KEY=sk-proj-... [Your API Key]
   PORT=5000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend server in development mode:
   ```bash
   npm run dev
   ```
   The API will be running at `http://localhost:5000`.

### 2. React Client Dashboard (`client/`)

1. Navigate to the `client/` directory.
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The dashboard app will be running at `http://localhost:5173`.

### 3. Model Context Protocol Server (`mcp-server/`)

The Model Context Protocol (MCP) server allows AI assistants (like Claude Desktop) to connect securely and manage notes using stdio JSON-RPC.

1. Navigate to the `mcp-server/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server (runs via stdio transport):
   ```bash
   npm start
   ```

To configure with **Claude Desktop**, add this server block to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "studymate-mcp": {
      "command": "node",
      "args": ["c:/Users/NEW/Desktop/finalCapstone/studymate/mcp-server/index.js"]
    }
  }
}
```

---

## 🛠️ Features Breakdown

### Part 1: Landing Page
- **Hero Area**: Beautiful header, branding logo, catchphrase, and "Open App" quick link to the dashboard.
- **Features Showcase**: Sleek grid displaying features (AI summarizing, quizzing, organizing) using custom glassmorphic styling and hover cards.
- **FAQ Section**: Smooth Accordion built with vanilla Javascript.
- **Theme Toggle**: Switch between dark theme and light theme, automatically saved using browser local storage.

### Part 2: Express Server API
- **Note Schema (`models/Note.js`)**: Structured schema specifying `title` (required), `subject`, `content` (required), `summary`, `quiz`, and `createdAt` date.
- **Endpoint Validations**: Standard validation returns `400 Bad Request` with structured JSON if required note inputs are missing.
- **API Endpoints**:
  - `GET /api/notes`: Retrieve notes ordered newest-first.
  - `POST /api/notes`: Add a note.
  - `DELETE /api/notes/:id`: Erase a note from MongoDB.
  - `POST /api/notes/:id/summarize`: Initiate AI summary and quiz generation.

### Part 3: OpenAI Summarization & Quiz Integration
- When triggering the `/api/notes/:id/summarize` endpoint, the server calls OpenAI's chat completions (`gpt-4o-mini`).
- Returns a structured output consisting of:
  1. A 3-bullet point summary of key concepts.
  2. A multiple-choice or short-answer quiz question to test retention.
- Saves the summary and quiz context back onto the note in MongoDB Atlas.

### Part 4: React Dashboard
- Built with React + Vite using custom dark mode aesthetics.
- **Add Note**: Controlled input components validation.
- **Search Bar**: Client-side query filtering by note title or subject tag.
- **Study AI Card Assistant**: Expandable card component displaying bulleted summaries and interactive quiz question sections upon AI completion.
- **Loading & Error handling**: Handles spinner loading states and dynamic error messages if service endpoints are unreachable.

### Part 5: MCP Integration
Exposes tools to external AI clients:
1. `list_notes`: Fetches notes list.
2. `create_note`: Inserts a new note with subject and contents directly into StudyMate database.
