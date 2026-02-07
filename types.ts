export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export type PollStatus = 'approved' | 'pending' | 'rejected';

export interface Poll {
  id: string;
  title: string;
  description: string;
  upvotes: number; // The "ranking" of the poll itself
  options: PollOption[];
  createdAt: number;
  tags?: string[];
  themeColor?: string; // Hex code or tailwind class hint
  status: PollStatus;
}

export type ViewState = 'HOME' | 'POLL_DETAILS' | 'CREATE_POLL' | 'ADMIN';

export interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  activePollId: string | null;
  setPollId: (id: string | null) => void;
}