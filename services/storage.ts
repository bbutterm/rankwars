import { Poll } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { handleSupabaseError, isSupabaseErrorCode } from './errorHandler';

// ============================================================
// Vote Tracking - NOW USING DATABASE (not localStorage)
// ============================================================

/**
 * Check if user has upvoted a poll (from database)
 * Falls back to localStorage for migration compatibility
 */
export const hasUserUpvoted = async (pollId: string): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  
  try {
    // Check using RPC function
    const { data, error } = await supabase!.rpc('has_user_upvoted', { p_poll_id: pollId });
    
    if (error) {
      console.error('Error checking upvote status:', error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.error('Error checking upvote status:', err);
    return false;
  }
};

/**
 * Check if user has voted in a poll (from database)
 */
export const hasUserVotedInPoll = async (pollId: string): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  
  try {
    // Check using RPC function
    const { data, error } = await supabase!.rpc('has_user_voted', { p_poll_id: pollId });
    
    if (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.error('Error checking vote status:', err);
    return false;
  }
};

/**
 * Get user's vote option ID for a specific poll
 */
export const getUserVoteOption = async (pollId: string): Promise<string | null> => {
  if (!isSupabaseConfigured) return null;
  
  try {
    const { data, error } = await supabase!.rpc('get_user_vote', { p_poll_id: pollId });
    
    if (error) {
      console.error('Error getting user vote:', error);
      return null;
    }
    
    return data || null;
  } catch (err) {
    console.error('Error getting user vote:', err);
    return null;
  }
};

// ============================================================
// API CALLS
// ============================================================

/**
 * Fetch all polls with their options
 */
export const getPolls = async (): Promise<Poll[]> => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('polls')
      .select(`
        *,
        options:poll_options(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching polls:", error);
      return [];
    }

    return data as Poll[];
  } catch (err) {
    console.error("Critical error in getPolls:", err);
    return [];
  }
};

/**
 * Save a new poll with options
 */
export const savePoll = async (poll: Partial<Poll>, options: string[]): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    // Validate input
    if (!poll.title?.trim()) {
      return { success: false, error: 'Title is required' };
    }
    
    const cleanOptions = options.filter(o => o.trim() !== '');
    if (cleanOptions.length < 2) {
      return { success: false, error: 'At least 2 options are required' };
    }
    
    if (cleanOptions.length > 10) {
      return { success: false, error: 'Maximum 10 options allowed' };
    }

    // Generate ID client-side
    const pollId = crypto.randomUUID();

    // Insert poll
    const { error: pollError } = await supabase
      .from('polls')
      .insert([{
        id: pollId,
        title: poll.title.trim(),
        description: poll.description?.trim() || null,
        tags: poll.tags || [],
        status: 'pending',
        upvotes: 0
      }]);

    if (pollError) {
      console.error("Error inserting poll:", pollError);
      return { success: false, error: handleSupabaseError(pollError) };
    }

    // Insert options
    const optionsToInsert = cleanOptions.map(text => ({
      poll_id: pollId,
      text: text.trim(),
      votes: 0
    }));

    const { error: optError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (optError) {
      console.error("Error inserting options:", optError);
      // Cleanup: delete the poll
      await supabase.from('polls').delete().eq('id', pollId);
      return { success: false, error: handleSupabaseError(optError) };
    }

    return { success: true };
  } catch (err) {
    console.error("Critical error in savePoll:", err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Seed test data (for development)
 */
export const seedTestData = async (): Promise<boolean> => {
  if (!supabase) return false;
  
  const testPolls = [
    {
      title: "Coke vs Pepsi",
      description: "The ultimate soda showdown. Which one reigns supreme?",
      tags: ["Drinks", "Classic"],
      options: ["Coca-Cola", "Pepsi", "Dr. Pepper", "I hate soda"]
    },
    {
      title: "Best Frontend Framework 2025",
      description: "Which technology are you betting on this year?",
      tags: ["Tech", "Dev"],
      options: ["React", "Vue", "Svelte", "Angular"]
    },
    {
      title: "Cats or Dogs?",
      description: "Settle the age-old debate about our furry friends.",
      tags: ["Animals", "Life"],
      options: ["Team Cat 🐱", "Team Dog 🐶", "Both!", "Neither"]
    }
  ];

  try {
    for (const p of testPolls) {
      const pollId = crypto.randomUUID();

      const { error: pollError } = await supabase
        .from('polls')
        .insert([{
          id: pollId,
          title: p.title,
          description: p.description,
          tags: p.tags,
          status: 'approved',
          upvotes: Math.floor(Math.random() * 50)
        }]);

      if (!pollError) {
        await supabase.from('poll_options').insert(
          p.options.map(text => ({
            poll_id: pollId,
            text,
            votes: Math.floor(Math.random() * 100)
          }))
        );
      }
    }
    return true;
  } catch (err) {
    console.error('Error seeding test data:', err);
    return false;
  }
};

/**
 * Approve a poll (admin only)
 */
export const approvePoll = async (id: string): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Not configured' };

  try {
    const { error } = await supabase
      .from('polls')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      return { success: false, error: handleSupabaseError(error) };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Delete a poll (admin only)
 */
export const deletePoll = async (id: string): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Not configured' };

  try {
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: handleSupabaseError(error) };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Upvote a poll (supports both authenticated and anonymous users)
 */
export const upvotePoll = async (pollId: string, isAnonymous: boolean = false): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Not configured' };
  }

  try {
    const { user } = await supabase!.auth.getUser();
    const isAuthenticated = !!user;

    // If authenticated, check if already upvoted
    if (isAuthenticated) {
      const hasUpvoted = await hasUserUpvoted(pollId);
      if (hasUpvoted) {
        return { success: false, error: 'Вы уже проголосовали за этот опрос' };
      }
    }

    // Use appropriate RPC function
    const { data, error } = await supabase!.rpc(
      isAuthenticated ? 'upvote_poll' : 'upvote_poll_anonymous',
      { p_poll_id: pollId }
    );

    if (error) {
      return { success: false, error: handleSupabaseError(error) };
    }

    // Parse JSON response from RPC
    if (typeof data === 'object' && data !== null) {
      if (!data.success) {
        return { success: false, error: data.error || 'Failed to upvote' };
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Critical error in upvotePoll:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

/**
 * Vote in a poll (supports both authenticated and anonymous users)
 */
export const voteInPoll = async (pollId: string, optionId: string, isAnonymous: boolean = false): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Not configured' };
  }

  try {
    const { user } = await supabase!.auth.getUser();
    const isAuthenticated = !!user;

    // If authenticated, check if already voted
    if (isAuthenticated) {
      const hasVoted = await hasUserVotedInPoll(pollId);
      if (hasVoted) {
        return { success: false, error: 'Вы уже голосовали в этом опросе' };
      }
    }

    // Use appropriate RPC function
    const { data, error } = await supabase!.rpc(
      isAuthenticated ? 'vote_poll' : 'vote_poll_anonymous',
      { 
        p_poll_id: pollId, 
        p_option_id: optionId 
      }
    );

    if (error) {
      return { success: false, error: handleSupabaseError(error) };
    }

    // Parse JSON response from RPC
    if (typeof data === 'object' && data !== null) {
      if (!data.success) {
        return { success: false, error: data.error || 'Failed to vote' };
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Critical error in voteInPoll:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// ============================================================
// Legacy Functions (for backward compatibility)
// ============================================================

/**
 * @deprecated Use upvotePoll instead
 */
export const upvotePollInStorage = async (id: string): Promise<boolean> => {
  const result = await upvotePoll(id);
  return result.success;
};

/**
 * @deprecated Use voteInPoll instead
 */
export const voteInPollStorage = async (pollId: string, optionId: string): Promise<boolean> => {
  const result = await voteInPoll(pollId, optionId);
  return result.success;
};
