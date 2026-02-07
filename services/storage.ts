import { Poll } from '../types';

const STORAGE_KEY = 'rankwars_data_v1';
const VOTES_KEY = 'rankwars_user_votes_v1'; // Tracks which polls user interacted with

// Helper to track user actions locally
interface UserVotes {
  upvotedPolls: string[]; // IDs of polls upvoted on leaderboard
  votedInPolls: string[]; // IDs of polls voted inside (options)
}

const getUserVotes = (): UserVotes => {
  const data = localStorage.getItem(VOTES_KEY);
  if (!data) return { upvotedPolls: [], votedInPolls: [] };
  return JSON.parse(data);
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

const INITIAL_DATA: Poll[] = [
  {
    id: '1',
    title: 'Pepsi vs. Coke',
    description: 'The eternal battle of the colas. Which one really tastes better?',
    upvotes: 142,
    createdAt: Date.now(),
    themeColor: 'blue',
    tags: ['Food', 'Drinks', 'Culture'],
    status: 'approved',
    options: [
      { id: 'opt1', text: 'Coca-Cola', votes: 350 },
      { id: 'opt2', text: 'Pepsi', votes: 290 },
      { id: 'opt3', text: 'Dr. Pepper (The dark horse)', votes: 120 }
    ]
  },
  {
    id: '2',
    title: 'Cats vs. Dogs',
    description: 'Which furry friend makes the ultimate companion?',
    upvotes: 89,
    createdAt: Date.now() - 100000,
    themeColor: 'orange',
    tags: ['Animals', 'Life', 'Fun'],
    status: 'approved',
    options: [
      { id: 'opt_c', text: 'Cats 🐱', votes: 200 },
      { id: 'opt_d', text: 'Dogs 🐶', votes: 215 }
    ]
  },
  {
    id: '3',
    title: 'Best Programming Language',
    description: 'For building scalable web applications in 2025.',
    upvotes: 210,
    createdAt: Date.now() - 500000,
    themeColor: 'indigo',
    tags: ['Tech', 'Dev', 'Work'],
    status: 'approved',
    options: [
      { id: 'ts', text: 'TypeScript', votes: 500 },
      { id: 'rs', text: 'Rust', votes: 320 },
      { id: 'go', text: 'Go', votes: 150 },
      { id: 'py', text: 'Python', votes: 400 }
    ]
  }
];

export const getPolls = (): Poll[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
  return JSON.parse(data);
};

export const savePoll = (poll: Poll): void => {
  const polls = getPolls();
  // Ensure status is pending if not specified (though strict types now require it)
  if (!poll.status) poll.status = 'pending';
  
  polls.push(poll);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
};

export const updatePoll = (updatedPoll: Poll): void => {
  const polls = getPolls();
  const index = polls.findIndex(p => p.id === updatedPoll.id);
  if (index !== -1) {
    polls[index] = updatedPoll;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
  }
};

export const deletePoll = (id: string): void => {
  const polls = getPolls();
  const newPolls = polls.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newPolls));
};

export const approvePoll = (id: string): void => {
  const polls = getPolls();
  const index = polls.findIndex(p => p.id === id);
  if (index !== -1) {
    polls[index].status = 'approved';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
  }
};

// Simulation of voting for a poll (ranking it up)
export const upvotePollInStorage = (id: string): Poll | undefined => {
  // Check if user already upvoted
  const userVotes = getUserVotes();
  if (userVotes.upvotedPolls.includes(id)) {
    return undefined; // Prevent duplicate vote
  }

  const polls = getPolls();
  const index = polls.findIndex(p => p.id === id);
  if (index !== -1) {
    polls[index].upvotes += 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
    
    // Save user action
    userVotes.upvotedPolls.push(id);
    saveUserVotes(userVotes);
    
    return polls[index];
  }
  return undefined;
};

// Simulation of voting IN a poll (choosing an option)
export const voteInPollStorage = (pollId: string, optionId: string): Poll | undefined => {
  // Check if user already voted in this poll
  const userVotes = getUserVotes();
  if (userVotes.votedInPolls.includes(pollId)) {
    return undefined;
  }

  const polls = getPolls();
  const pIndex = polls.findIndex(p => p.id === pollId);
  if (pIndex !== -1) {
    const oIndex = polls[pIndex].options.findIndex(o => o.id === optionId);
    if (oIndex !== -1) {
      polls[pIndex].options[oIndex].votes += 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));

      // Save user action
      userVotes.votedInPolls.push(pollId);
      saveUserVotes(userVotes);

      return polls[pIndex];
    }
  }
  return undefined;
};