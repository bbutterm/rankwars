import { Poll, PollOption } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const VOTES_KEY = 'rankwars_user_votes_v1';

interface UserVotes {
  upvotedPolls: string[];
  votedInPolls: string[];
}

const getUserVotes = (): UserVotes => {
  const data = localStorage.getItem(VOTES_KEY);
  if (!data) return { upvotedPolls: [], votedInPolls: [] };
  try {
    return JSON.parse(data);
  } catch {
    return { upvotedPolls: [], votedInPolls: [] };
  }
};

const saveUserVotes = (votes: UserVotes) => {
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
};

export const hasUserUpvoted = (pollId: string): boolean => {
  return getUserVotes().upvotedPolls.includes(pollId);
};

export const hasUserVotedInPoll = (pollId: string): boolean => {
  return getUserVotes().votedInPolls.includes(pollId);
};

// API CALLS
export const getPolls = async (): Promise<Poll[]> => {
  if (!supabase) return [];

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
};

export const savePoll = async (poll: Partial<Poll>, options: string[]): Promise<boolean> => {
  if (!supabase) {
    console.error("Supabase client not initialized");
    return false;
  }

  try {
    // GENERATE ID CLIENT-SIDE
    // This fixes the 401 Error because we don't need to .select() the pending poll
    // (which might be blocked by RLS policies) to get its ID.
    const pollId = self.crypto.randomUUID();

    // 1. Insert Poll with explicit ID
    const { error: pollError } = await supabase
      .from('polls')
      .insert([{
        id: pollId,
        title: poll.title,
        description: poll.description,
        tags: poll.tags || [],
        status: 'pending',
        upvotes: 0
      }]);

    if (pollError) {
      console.error("Error inserting poll:", JSON.stringify(pollError));
      return false;
    }

    // 2. Insert Options using the known pollId
    const optionsToInsert = options.map(text => ({
      poll_id: pollId,
      text: text,
      votes: 0
    }));

    const { error: optError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (optError) {
      console.error("Error inserting options:", JSON.stringify(optError));
      // Try to cleanup
      await supabase.from('polls').delete().eq('id', pollId);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Critical error in savePoll:", err);
    return false;
  }
};

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

  for (const p of testPolls) {
    // Using the same client-side ID strategy for seeding
    const pollId = self.crypto.randomUUID();

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
};

export const approvePoll = async (id: string): Promise<void> => {
  if (!supabase) return;
  await supabase
    .from('polls')
    .update({ status: 'approved' })
    .eq('id', id);
};

export const deletePoll = async (id: string): Promise<void> => {
  if (!supabase) return;
  await supabase
    .from('polls')
    .delete()
    .eq('id', id);
};

export const upvotePollInStorage = async (id: string): Promise<boolean> => {
  if (!supabase || hasUserUpvoted(id)) return false;

  const { error } = await supabase.rpc('increment_poll_upvotes', { poll_id: id });

  if (!error) {
    const votes = getUserVotes();
    votes.upvotedPolls.push(id);
    saveUserVotes(votes);
    return true;
  }
  return false;
};

export const voteInPollStorage = async (pollId: string, optionId: string): Promise<boolean> => {
  if (!supabase || hasUserVotedInPoll(pollId)) return false;

  const { error } = await supabase.rpc('increment_option_votes', { option_id: optionId });

  if (!error) {
    const votes = getUserVotes();
    votes.votedInPolls.push(pollId);
    saveUserVotes(votes);
    return true;
  }
  return false;
};
