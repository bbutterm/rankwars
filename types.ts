export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  votes: number;
}

export type PollStatus = 'approved' | 'pending' | 'rejected';

export interface Poll {
  id: string;
  title: string;
  description: string;
  upvotes: number;
  options: PollOption[];
  created_at: string; // Supabase uses ISO string
  createdAt?: number; // legacy fallback
  tags?: string[];
  themeColor?: string;
  status: PollStatus;
}

export type ViewState = 'HOME' | 'POLL_DETAILS' | 'CREATE_POLL' | 'ADMIN';

export interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  activePollId: string | null;
  setPollId: (id: string | null) => void;
}