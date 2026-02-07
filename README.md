# ⚔️ RankWars (MVP)

A visually stunning voting platform where users create polls, rank them on a global leaderboard, and vote within them. 

**Stack:** React 19, Tailwind CSS, Lucide Icons, Google Gemini AI.

## 🌟 Features

*   **Create Polls:** AI-assisted generation of options and tags.
*   **Vote & Rank:** Interactive voting UI with confetti effects.
*   **Moderation:** Admin dashboard to Approve/Decline user-submitted polls.
*   **Search & Filter:** Find polls by tags or text.
*   **Responsive:** Mobile-first design.

## 🛠 Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for a detailed file tree.

## 🚀 How to Run Locally

1.  **Clone the repo**
2.  **Serve the files:**
    Since this project uses ES Modules via CDN, you strictly need a local server (opening `index.html` directly won't work due to CORS policies on modules).
    
    If you have Python:
    ```bash
    python3 -m http.server
    ```
    Or using Node `serve`:
    ```bash
    npx serve .
    ```
3.  **Open in Browser:** Go to `http://localhost:8000` (or whatever port your server uses).

## ☁️ Deploy to Vercel

This project is ready for static deployment.

1.  Push this code to **GitHub**.
2.  Go to **Vercel** -> **Add New Project**.
3.  Select your repository.
4.  **Settings:**
    *   **Framework Preset:** Select `Other` (because we are using native ES modules without a bundler build step).
    *   **Build Command:** Leave empty.
    *   **Output Directory:** Leave empty (or use `.`/`root`).
5.  **Environment Variables:**
    *   Add `API_KEY` : Your Google Gemini API Key. (Note: Since this is a client-side app, you will need to manually paste the key into `services/aiService.ts` for the MVP, or set up a build replacement. For Vercel static, it's best to hardcode it for a demo or move to a backend proxy).

## 🔮 Future Roadmap

See [SERVER_PLAN.md](./SERVER_PLAN.md) for our migration strategy to Supabase.
