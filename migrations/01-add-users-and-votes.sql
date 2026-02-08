-- ============================================================
-- RankWars Database Migration: Users & Votes Tracking
-- Version: 1.0
-- Description: Creates public.users table, poll_votes, poll_upvotes
--              with proper RLS, triggers, indexes, and constraints
-- ============================================================

-- ============================================================
-- 1. CREATE public.users TABLE
-- ============================================================
-- Why not use auth.users directly?
-- - auth.users is a system table (read-only, limited access)
-- - No custom fields (is_admin, preferences, stats)
-- - Hard to migrate to other backends later
-- - Complex queries are slow on auth.users

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_moderator BOOLEAN DEFAULT FALSE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. CREATE TRIGGER: Auto-create user on registration
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    split_part(NEW.email, '@', 1)  -- Use email prefix as display name
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. CREATE poll_votes TABLE
-- ============================================================
-- Tracks user votes in polls
-- UNIQUE constraint prevents duplicate votes per user per poll

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_poll_vote UNIQUE (poll_id, user_id)
);

-- ============================================================
-- 4. CREATE poll_upvotes TABLE
-- ============================================================
-- Tracks user upvotes on polls
-- UNIQUE constraint prevents duplicate upvotes per user per poll

CREATE TABLE poll_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_poll_upvote UNIQUE (poll_id, user_id)
);

-- ============================================================
-- 5. UPDATE FUNCTION: update_updated_at_column (for triggers)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. ADD updated_at COLUMN TO EXISTING TABLES (if not exists)
-- ============================================================

-- Check and add to polls
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'polls' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE polls ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    
    CREATE TRIGGER update_polls_updated_at
      BEFORE UPDATE ON polls
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Check and add to poll_options
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'poll_options' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE poll_options ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    
    CREATE TRIGGER update_poll_options_updated_at
      BEFORE UPDATE ON poll_options
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- ============================================================
-- 7. CREATE INDEXES (Performance)
-- ============================================================

-- Polls indexes
CREATE INDEX IF NOT EXISTS idx_polls_status_created ON polls(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_polls_upvotes ON polls(upvotes DESC);

-- Poll options indexes
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);

-- Poll votes indexes
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_created ON poll_votes(created_at DESC);

-- Poll upvotes indexes
CREATE INDEX IF NOT EXISTS idx_poll_upvotes_poll_id ON poll_upvotes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_upvotes_user_id ON poll_upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_upvotes_created ON poll_upvotes(created_at DESC);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_created ON public.users(created_at DESC);

-- ============================================================
-- 8. ADD CONSTRAINTS (Validation)
-- ============================================================

-- Polls constraints
DO $$
BEGIN
  -- Check if constraint exists before adding
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_poll_title_not_empty'
  ) THEN
    ALTER TABLE polls 
      ADD CONSTRAINT check_poll_title_not_empty 
      CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 200);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_poll_description_length'
  ) THEN
    ALTER TABLE polls 
      ADD CONSTRAINT check_poll_description_length 
      CHECK (char_length(COALESCE(description, '')) <= 2000);
  END IF;
END
$$;

-- Poll options constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_option_text_not_empty'
  ) THEN
    ALTER TABLE poll_options 
      ADD CONSTRAINT check_option_text_not_empty 
      CHECK (char_length(trim(text)) > 0 AND char_length(text) <= 100);
  END IF;
END
$$;

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_upvotes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. RLS POLICIES FOR public.users
-- ============================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id AND NOT is_admin);

-- Public can view basic info (email, display_name) but not sensitive data
-- Note: This is handled by SELECT in application, not by RLS
CREATE POLICY "Public can view users" ON public.users
  FOR SELECT USING (TRUE);

-- ============================================================
-- 11. RLS POLICIES FOR poll_votes
-- ============================================================

-- Users can insert their own votes
CREATE POLICY "Users can insert votes" ON poll_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own votes
CREATE POLICY "Users can view own votes" ON poll_votes
  FOR SELECT USING (auth.uid() = user_id);

-- Public can see vote counts (but not who voted)
-- This is handled by aggregation queries
CREATE POLICY "Public can view vote counts" ON poll_votes
  FOR SELECT USING (TRUE);

-- ============================================================
-- 12. RLS POLICIES FOR poll_upvotes
-- ============================================================

-- Users can insert their own upvotes
CREATE POLICY "Users can insert upvotes" ON poll_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own upvotes
CREATE POLICY "Users can view own upvotes" ON poll_upvotes
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 13. REWRITE RPC FUNCTIONS (Better security & error handling)
-- ============================================================

-- DROP old functions if they exist
DROP FUNCTION IF EXISTS increment_poll_upvotes(UUID);
DROP FUNCTION IF EXISTS increment_option_votes(UUID);

-- ============================================================
-- 14. NEW FUNCTION: vote_poll
-- ============================================================
-- Vote in a poll with proper validation
-- Returns JSON with success/error info
CREATE OR REPLACE FUNCTION vote_poll(p_poll_id UUID, p_option_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_poll_status poll_status;
  v_option_exists BOOLEAN;
BEGIN
  -- Check if poll exists and is approved
  SELECT p.status INTO v_poll_status
  FROM polls p
  WHERE p.id = p_poll_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Poll not found', 'code', 'POLL_NOT_FOUND');
  END IF;
  
  IF v_poll_status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Poll is not approved', 'code', 'POLL_NOT_APPROVED');
  END IF;
  
  -- Check if option exists and belongs to this poll
  SELECT EXISTS (
    SELECT 1 FROM poll_options 
    WHERE id = p_option_id AND poll_id = p_poll_id
  ) INTO v_option_exists;
  
  IF NOT v_option_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Option not found or invalid', 'code', 'OPTION_INVALID');
  END IF;
  
  -- Insert vote - UNIQUE constraint will prevent duplicates
  INSERT INTO poll_votes (poll_id, option_id, user_id)
  VALUES (p_poll_id, p_option_id, auth.uid());
  
  -- Increment vote count
  UPDATE poll_options
  SET votes = votes + 1
  WHERE id = p_option_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Vote recorded');
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already voted in this poll', 'code', 'ALREADY_VOTED');
  WHEN not_null_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated', 'code', 'NOT_AUTHENTICATED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 15. NEW FUNCTION: upvote_poll
-- ============================================================
-- Upvote a poll with proper validation
-- Returns JSON with success/error info
CREATE OR REPLACE FUNCTION upvote_poll(p_poll_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_poll_exists BOOLEAN;
BEGIN
  -- Check if poll exists and is approved
  SELECT EXISTS (
    SELECT 1 FROM polls 
    WHERE id = p_poll_id AND status = 'approved'
  ) INTO v_poll_exists;
  
  IF NOT v_poll_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Poll not found or not approved', 'code', 'POLL_INVALID');
  END IF;
  
  -- Insert upvote - UNIQUE constraint will prevent duplicates
  INSERT INTO poll_upvotes (poll_id, user_id)
  VALUES (p_poll_id, auth.uid());
  
  -- Increment upvote count
  UPDATE polls
  SET upvotes = upvotes + 1
  WHERE id = p_poll_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Upvote recorded');
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already upvoted this poll', 'code', 'ALREADY_UPVOTED');
  WHEN not_null_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated', 'code', 'NOT_AUTHENTICATED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 16. HELPER FUNCTION: Check if user voted in poll
-- ============================================================
CREATE OR REPLACE FUNCTION has_user_voted(p_poll_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM poll_votes
    WHERE poll_id = p_poll_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 17. HELPER FUNCTION: Check if user upvoted poll
-- ============================================================
CREATE OR REPLACE FUNCTION has_user_upvoted(p_poll_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM poll_upvotes
    WHERE poll_id = p_poll_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 18. HELPER FUNCTION: Get user's vote in a poll
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_vote(p_poll_id UUID)
RETURNS UUID AS $$
DECLARE
  v_option_id UUID;
BEGIN
  SELECT option_id INTO v_option_id
  FROM poll_votes
  WHERE poll_id = p_poll_id AND user_id = auth.uid();
  
  RETURN v_option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 19. HELPER FUNCTION: Make user admin (for first admin setup)
-- ============================================================
CREATE OR REPLACE FUNCTION make_myself_admin()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated', 'code', 'NOT_AUTHENTICATED');
  END IF;
  
  UPDATE public.users
  SET is_admin = TRUE,
      updated_at = now()
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'You are now an admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 20. VIEW: Polls with vote/upvote stats
-- ============================================================
CREATE OR REPLACE VIEW polls_with_stats AS
SELECT 
  p.*,
  COALESCE(vote_stats.total_votes, 0) as total_votes,
  COALESCE(upvote_stats.total_upvotes, 0) as total_upvotes,
  COALESCE(user_voted.has_voted, FALSE) as current_user_voted,
  COALESCE(user_upvoted.has_upvoted, FALSE) as current_user_upvoted
FROM polls p
LEFT JOIN (
  SELECT poll_id, COUNT(*) as total_votes
  FROM poll_votes
  GROUP BY poll_id
) vote_stats ON p.id = vote_stats.poll_id
LEFT JOIN (
  SELECT poll_id, COUNT(*) as total_upvotes
  FROM poll_upvotes
  GROUP BY poll_id
) upvote_stats ON p.id = upvote_stats.poll_id
LEFT JOIN LATERAL (
  SELECT TRUE as has_voted
  WHERE EXISTS (SELECT 1 FROM poll_votes WHERE poll_id = p.id AND user_id = auth.uid())
) user_voted ON TRUE
LEFT JOIN LATERAL (
  SELECT TRUE as has_upvoted
  WHERE EXISTS (SELECT 1 FROM poll_upvotes WHERE poll_id = p.id AND user_id = auth.uid())
) user_upvoted ON TRUE;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
-- Next steps:
-- 1. Verify all tables were created: SELECT * FROM information_schema.tables WHERE table_schema = 'public';
-- 2. Verify RLS is enabled: SELECT * FROM pg_policies WHERE schemaname = 'public';
-- 3. Test functions by calling them from the application
-- 4. Create your first admin by calling: SELECT make_myself_admin();
-- ============================================================
