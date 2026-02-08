export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  votes: number;
  updated_at?: string;
}

export type PollStatus = 'approved' | 'pending' | 'rejected';

export interface Poll {
  id: string;
  title: string;
  description: string;
  upvotes: number;
  options: PollOption[];
  created_at: string; // Supabase uses ISO string
  updated_at?: string;
  createdAt?: number; // legacy fallback
  tags?: string[];
  themeColor?: string;
  status: PollStatus;
}

// User types from public.users table
export interface AppUser {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  is_moderator: boolean;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Vote tracking types
export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

export interface PollUpvote {
  id: string;
  poll_id: string;
  user_id: string;
  created_at: string;
}

export type ViewState = 'HOME' | 'POLL_DETAILS' | 'CREATE_POLL' | 'ADMIN';

export interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  activePollId: string | null;
  setPollId: (id: string | null) => void;
}