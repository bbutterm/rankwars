-- ============================================================
-- Migration: Allow Anonymous Voting
-- Version: 1.1
-- Description: Allow non-authenticated users to vote without tracking
-- ============================================================

-- ============================================================
-- New Function: vote_poll_anonymous
-- Allows anonymous voting without database tracking
-- ============================================================
CREATE OR REPLACE FUNCTION vote_poll_anonymous(p_poll_id UUID, p_option_id UUID)
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
  
  -- Increment vote count (no user tracking)
  UPDATE poll_options
  SET votes = votes + 1
  WHERE id = p_option_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Vote recorded');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- New Function: upvote_poll_anonymous
-- Allows anonymous upvoting without database tracking
-- ============================================================
CREATE OR REPLACE FUNCTION upvote_poll_anonymous(p_poll_id UUID)
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
  
  -- Increment upvote count (no user tracking)
  UPDATE polls
  SET upvotes = upvotes + 1
  WHERE id = p_poll_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Upvote recorded');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
