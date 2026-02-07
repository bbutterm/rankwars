# 🚀 RankWars - Backend Strategy (Supabase)

To move from MVP to Production, we will migrate from `localStorage` to **Supabase** (PostgreSQL + Auth + Edge Functions).

## 1. Database Schema (PostgreSQL)

We need relational data to handle concurrency and security.

### Tables

**`profiles`** (Users)
- `id` (uuid, PK, references auth.users)
- `username` (text, unique)
- `avatar_url` (text)
- `is_admin` (boolean, default false)

**`polls`**
- `id` (uuid, PK)
- `created_by` (uuid, FK to profiles)
- `title` (text)
- `description` (text)
- `tags` (text array)
- `status` (enum: 'pending', 'approved', 'rejected')
- `upvotes_count` (int, default 0)
- `created_at` (timestamp)

**`poll_options`**
- `id` (uuid, PK)
- `poll_id` (uuid, FK to polls)
- `text` (text)
- `vote_count` (int, default 0)

**`poll_votes`** (Tracks who voted for what option to prevent duplicates)
- `id` (uuid, PK)
- `user_id` (uuid, FK to profiles)
- `poll_id` (uuid, FK to polls)
- `option_id` (uuid, FK to poll_options)
- *Constraint:* Unique(user_id, poll_id)

**`poll_rankings`** (Tracks who upvoted the poll itself)
- `id` (uuid, PK)
- `user_id` (uuid)
- `poll_id` (uuid)
- *Constraint:* Unique(user_id, poll_id)

---

## 2. Security (Row Level Security - RLS)

We will use Postgres RLS policies to enforce logic without writing backend code.

1.  **Public Read:** Everyone can see `approved` polls.
2.  **Admin Read:** Only `is_admin = true` can see `pending` polls.
3.  **Creation:** Authenticated users can INSERT into `polls` (status default `pending`).
4.  **Voting:** 
    - Users can INSERT into `poll_votes` only if they haven't voted in that poll yet.
    - Users can INSERT into `poll_rankings`.
5.  **Moderation:** Only `is_admin` can UPDATE `polls.status`.

---

## 3. Server-Side Logic (Edge Functions)

We cannot keep the Gemini API Key in the frontend code.

**Function: `generate-poll-options`**
- **Trigger:** Called via REST API from client.
- **Input:** `{ topic: string }`
- **Logic:** 
    1. Check if user is authenticated (optional, for rate limiting).
    2. Call Google Gemini API (Key stored in Supabase Vault/Env).
    3. Return JSON.
- **Benefit:** API Key never touches the user's browser.

---

## 4. Migration Steps

1.  **Setup Supabase Project:** Create tables via SQL Editor.
2.  **Install Client:** `npm install @supabase/supabase-js`.
3.  **Refactor `storage.ts`:**
    - Replace `localStorage.getItem` with `supabase.from('polls').select('*')`.
    - Replace `savePoll` with `supabase.from('polls').insert(...)`.
4.  **Add Auth:** Add Google/GitHub Login button on the frontend.
