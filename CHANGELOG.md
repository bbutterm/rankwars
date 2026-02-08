# 📝 Changelog - RankWars

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-02-08

### 🎯 New Features
- **Anonymous Voting Support** - Non-authenticated users can now vote (votes not tracked in database)
- **Proper Share Links** - Share button now generates URL to specific poll (`/poll/{id}`)
- **Admin Self-Promotion** - New "Make Me Admin" button for initial admin setup

### 🔒 Security Improvements
- **Database Vote Tracking** - All votes now stored in PostgreSQL database
- **UNIQUE Constraints** - Prevent duplicate votes and upvotes at database level
- **Server-Side Admin Check** - Admin status verified through database, not hardcoded emails
- **Environment Variables** - Supabase credentials moved from hardcoded to .env

### 🗃️ Database Changes
- New table: `public.users` - User profiles linked to auth.users
- New table: `poll_votes` - Vote tracking with UNIQUE (user_id, poll_id) constraint
- New table: `poll_upvotes` - Upvote tracking with UNIQUE (user_id, poll_id) constraint
- New RPC functions:
  - `vote_poll(poll_id, option_id)` - Authenticated voting
  - `vote_poll_anonymous(poll_id, option_id)` - Anonymous voting
  - `upvote_poll(poll_id)` - Authenticated upvoting
  - `upvote_poll_anonymous(poll_id)` - Anonymous upvoting
  - `has_user_voted(poll_id)` - Check user vote status
  - `has_user_upvoted(poll_id)` - Check user upvote status
  - `get_user_vote(poll_id)` - Get user's vote option
  - `make_myself_admin()` - Self-promotion to admin
- New indexes on all foreign keys and commonly queried fields
- New constraints: UNIQUE on votes/upvotes, NOT NULL on required fields, length limits
- Trigger: Auto-create public.users record on auth.users registration

### 🏗️ Architecture Improvements
- **Auth Context** - Centralized authentication state management
- **Error Handler** - Unified error handling with user-friendly messages
- **Type Updates** - Added AppUser, PollVote, PollUpvote interfaces

### 🔄 Breaking Changes
- `hasUserUpvoted()` and `hasUserVotedInPoll()` are now **async** functions
- `upvotePollInStorage()` and `voteInPollStorage()` are **deprecated**
- Vote/upvote functions now return `{ success: boolean, error?: string }` instead of boolean
- Removed localStorage-based vote tracking

### 🧹 Removed
- LocalStorage vote tracking (all votes now in database)
- Hardcoded admin emails list (now in database)
- Legacy vote checking functions

### 📦 New Files
- `services/errorHandler.ts` - Centralized error handling
- `contexts/AuthContext.tsx` - Authentication context
- `migrations/01-add-users-and-votes.sql` - Database schema migration
- `migrations/02-allow-anonymous-voting.sql` - Anonymous voting support
- `.env.example` - Environment variables template
- `.gitignore` - Git ignore rules
- `MIGRATION_COMPLETE.md` - Migration documentation
- `CHANGELOG.md` - This file

### 📝 Updated Files
- `types.ts` - Added new type definitions
- `services/supabase.ts` - Environment variable support
- `services/storage.ts` - Removed localStorage, added DB-based functions
- `App.tsx` - Added AuthProvider, updated navigation
- `pages/Admin.tsx` - Removed hardcoded emails, uses AuthContext
- `pages/Home.tsx` - Async vote checking, anonymous support
- `pages/PollView.tsx` - Anonymous support, proper share URLs

### 🔧 Developer Notes
- To make yourself admin: Sign in, go to Admin page, click "Make Me Admin"
- Non-authenticated users can vote but cannot see their vote history
- All votes are atomic and protected by database constraints
- Admin status stored in `public.users.is_admin` field

---

## [1.0.0] - Initial Release

### ✨ Features
- Create polls with multiple options
- Vote in polls
- Upvote polls (ranking system)
- Admin moderation panel
- Tags system
- Search polls
- Sort by Hot/New
- Share functionality
- Toast notifications
- Confetti effects

### 🛠️ Tech Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (PostgreSQL)
- Lucide Icons
- Canvas Confetti
