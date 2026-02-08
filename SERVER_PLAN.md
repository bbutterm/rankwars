# 🚀 RankWars - Supabase Migration SQL

Copy and paste the following into your **Supabase SQL Editor** to set up the database.

## 1. Create Schema

```sql
-- Status enum
CREATE TYPE poll_status AS ENUM ('pending', 'approved', 'rejected');

-- Main Polls table
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  status poll_status DEFAULT 'pending',
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Options table
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 0
);
```

## 2. Remote Functions (for atomic increments)

These allow users to vote without downloading and overwriting the whole poll object.

```sql
-- Function to increment poll upvotes
CREATE OR REPLACE FUNCTION increment_poll_upvotes(poll_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE polls
  SET upvotes = upvotes + 1
  WHERE id = poll_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment option votes
CREATE OR REPLACE FUNCTION increment_option_votes(option_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE poll_options
  SET votes = votes + 1
  WHERE id = option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 3. Row Level Security (RLS)

By default, everything is private. Run these to allow public interaction.

```sql
-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

-- 1. Public can read approved polls
CREATE POLICY "Public Read Approved" ON polls
  FOR SELECT USING (status = 'approved');

-- 2. Public can read options (of any poll they can see)
CREATE POLICY "Public Read Options" ON poll_options
  FOR SELECT USING (TRUE);

-- 3. Public can insert new polls (default pending)
CREATE POLICY "Public Create Polls" ON polls
  FOR INSERT WITH CHECK (TRUE);

-- 4. Public can insert options for their polls
CREATE POLICY "Public Create Options" ON poll_options
  FOR INSERT WITH CHECK (TRUE);

-- 5. ADMINS can do everything
-- Note: Replace 'your-admin-email@example.com' with your actual email if using simple check,
-- or just allow all authenticated users for this MVP.
CREATE POLICY "Admins full access" ON polls
  FOR ALL TO authenticated USING (TRUE);

CREATE POLICY "Admins full options access" ON poll_options
  FOR ALL TO authenticated USING (TRUE);
```

---

## 🔑 Environment Variables

In your Vercel or local environment, set:

```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
API_KEY=your_gemini_api_key
```
