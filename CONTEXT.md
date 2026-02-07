# RankWars Project Context

## Overview
RankWars is an MVP voting platform where users can:
1. **Rank Polls:** Users upvote specific poll topics to move them up the global leaderboard.
2. **Vote in Polls:** Users enter a poll to vote for specific options (e.g., Coke vs. Pepsi).
3. **Create Polls:** Anyone can submit a poll. It defaults to a "Pending" status.
4. **Moderate:** Admins can view "Pending" polls and Approve or Reject them.

## Architecture
- **Client-Side Only (MVP):** The application runs entirely in the browser.
- **Frontend:** React 18 + Tailwind CSS.
- **Database:** `localStorage` acts as a mock database.
- **Workflow:**
    1. User submits poll -> `status: pending`
    2. Admin views pending list -> Approves -> `status: approved`
    3. Home page displays only `approved` polls.
- **Vote Tracking:** Since there is no User Auth, we track votes using `localStorage` to prevent simple spamming on a single device.
- **AI:** Google Gemini API connects directly from the client.

## Technical Stack
- **Frontend:** React 18 (TypeScript)
- **Styling:** Tailwind CSS (Mobile-first, Dark Mode default)
- **Icons:** Lucide React
- **Effects:** Canvas Confetti
- **Data Persistence:** `localStorage`
- **AI Integration:** Google Gemini API (`@google/genai` SDK)

## Project Structure
- `App.tsx`: Main entry point, handles state-based routing.
- `pages/Home.tsx`: Lists approved polls.
- `pages/CreatePoll.tsx`: Public form to submit new polls.
- `pages/Admin.tsx`: Moderation dashboard for pending polls.
- `services/storage.ts`: Persistence and logic layer.

## Future Plans & Roadmap
1. **Supabase Migration:** Move storage to Postgres.
2. **Auth:** Real user accounts.
3. **Roles:** Restrict the Moderation page to actual admins (currently accessible to all for MVP demo).

## Developer Notes
- **Styling:** We use standard Tailwind classes.
- **AI:** The API key is currently pulled from `process.env.API_KEY`.
- **Routing:** Handled via `currentView` state in `App.tsx`.

## How to Run
1. `npm install`
2. `export API_KEY=your_gemini_key`
3. `npm start`
