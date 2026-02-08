# ⚔️ RankWars (MVP)

A visually stunning voting platform where users create polls, rank them on a global leaderboard, and vote within them.

**Stack:** React 19, Vite, Tailwind CSS, Lucide Icons, Google Gemini AI, Supabase.

## 🚀 How to Run Locally

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Setup:**
    Create a `.env` file in the root directory and add your API Key:
    ```env
    API_KEY=your_google_gemini_api_key
    ```
3.  **Start Development Server:**
    ```bash
    npm run dev
    ```
4.  **Open in Browser:**
    Go to `http://localhost:5173`

## ☁️ Deploy to Vercel

1.  Push this code to **GitHub**.
2.  Go to **Vercel** -> **Add New Project**.
3.  Select your repository.
4.  **Settings:**
    *   **Framework Preset:** Vite (should be detected automatically).
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
5.  **Environment Variables:**
    *   Add `API_KEY` in the Vercel Project Settings. This is required for the AI polling features to work.

## 🛠 Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for a detailed file tree.

## 🔮 Future Roadmap

See [SERVER_PLAN.md](./SERVER_PLAN.md) for database migration strategy.