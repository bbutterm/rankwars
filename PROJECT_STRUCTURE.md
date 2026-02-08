# 📂 RankWars - Frontend Architecture

## File Tree
```text
/
├── index.html            # Entry point, Tailwind CDN
├── index.tsx             # React Root mount
├── App.tsx               # Main Router & Layout logic
├── types.ts              # TypeScript interfaces (Poll, ViewState, etc.)
├── metadata.json         # Project metadata for build tools
├── services/
│   ├── storage.ts        # LocalStorage Wrapper (Fake DB layer)
│   └── aiService.ts      # (Deprecated) Disabled AI service
├── components/
│   ├── Button.tsx        # Reusable styled button
│   └── Toast.tsx         # Notification system (Event bus based)
├── pages/
│   ├── Home.tsx          # Main Feed (Filtering, Sorting, Ranking)
│   ├── PollView.tsx      # Voting Interface (Progress bars, Confetti)
│   ├── CreatePoll.tsx    # Public submission form
│   └── Admin.tsx         # Moderation Dashboard
├── PROJECT_STRUCTURE.md  # This file
├── SERVER_PLAN.md        # Backend roadmap
└── README.md             # Setup & Deploy instructions
```

## Key Components

### 1. State Management (`App.tsx`)
Currently, we use a simple state-based router instead of `react-router-dom` to keep the MVP lightweight.
- `currentView`: Controls which Page component is rendered.
- `activePollId`: Passes context to `PollView`.

### 2. Data Layer (`services/storage.ts`)
Acts as a synchronous mock database using the browser's `localStorage` or Supabase if configured.
- **Rankings:** `upvotePollInStorage` handles the leaderboard logic.
- **Voting:** `voteInPollStorage` handles option selection.
- **Moderation:** `approvePoll` / `deletePoll` handles status changes.

### 3. UI/UX
- **Styling:** Tailwind CSS via CDN (for speed).
- **Icons:** Lucide React.
- **Feedback:** 
    - `canvas-confetti` for positive reinforcement.
    - Custom `Toast` system for notifications without blocking UI.