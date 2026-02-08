import React, { useEffect, useState } from 'react';
import { Poll, NavigationProps } from '../types';
import { getPolls, voteInPoll, getUserVoteOption } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Share2, CheckCircle2, Crown, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from '../components/Toast';

interface PollViewProps extends NavigationProps {}

export const PollView: React.FC<PollViewProps> = ({ activePollId, setView }) => {
  const { isAuthenticated } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    loadData();
  }, [activePollId, isAuthenticated]);

  const loadData = async () => {
    if (!activePollId) {
      setView('HOME');
      return;
    }
    setLoading(true);
    const allPolls = await getPolls();
    const found = allPolls.find(p => p.id === activePollId);
    
    if (found) {
      setPoll(found);
      
      // Check if user has voted (from database) - only for authenticated users
      if (isAuthenticated) {
        const votedOptionId = await getUserVoteOption(activePollId);
        setHasVoted(!!votedOptionId);
        setSelectedOption(votedOptionId);
      }
    } else {
      setPoll(null);
    }
    
    setLoading(false);
  };

  const handleVote = async (optionId: string) => {
    if (!poll || hasVoted || voting) return;
    
    setVoting(true);
    
    // Pass isAnonymous flag based on authentication
    const result = await voteInPoll(poll.id, optionId, !isAuthenticated);
    setVoting(false);
    
    if (result.success) {
      setSelectedOption(optionId);
      setHasVoted(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast("Vote recorded! 🎉");
      loadData(); // Refresh counts
    } else {
      toast(result.error || 'Failed to vote', 'error');
    }
  };

  const handleShare = () => {
    // Generate URL with poll ID
    const pollUrl = `${window.location.origin}/#/poll/${poll?.id || activePollId}`;
    navigator.clipboard.writeText(pollUrl);
    toast("Link copied to clipboard!", "success");
  };

  if (loading) return <div className="flex justify-center mt-20 text-slate-500"><Loader2 className="animate-spin" /></div>;
  if (!poll) return <div className="text-white text-center mt-20">Poll not found</div>;

  const totalVotes = poll.options?.reduce((acc, curr) => acc + curr.votes, 0) || 0;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => setView('HOME')} className="flex items-center text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} className="mr-2" /> Back to Top
        </button>
        <button onClick={handleShare} className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors">
          <Share2 size={20} />
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">{poll.title}</h1>
        <p className="text-slate-400 mb-8 text-lg">{poll.description}</p>
        
        {!isAuthenticated && !hasVoted && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.276V11.996c0-1.61-1.962-2.276-3.502-2.276H6.342c-1.54 0-2.502 1.667-2.502 3.277v8.728c0 1.609 1.962 2.276 3.502 2.276H16.5m-8.5-9V12" />
            </svg>
            <span>Не авторизованы? Можете голосовать, но ваш голос не будет сохранён в истории.</span>
          </div>
        )}

        {poll.tags && poll.tags.length > 0 && (
          <div className="flex gap-2 mb-6">
            {poll.tags.map(t => (
              <span key={t} className="bg-slate-700/50 px-2.5 py-1 rounded-md text-slate-300 text-sm">#{t}</span>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {poll.options?.map((option) => {
            const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
            const isSelected = selectedOption === option.id;
            const isWinning = totalVotes > 0 && option.votes === Math.max(...poll.options.map(o => o.votes));

            return (
              <div 
                key={option.id}
                onClick={() => !hasVoted && !voting && handleVote(option.id)}
                className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer ${hasVoted || voting ? 'border-transparent bg-slate-700/30 cursor-not-allowed' : 'border-slate-600 hover:border-indigo-500 hover:bg-slate-700/50 bg-slate-700/20'} ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
              >
                {hasVoted && (
                  <div className={`absolute inset-0 h-full transition-all duration-1000 ease-out ${isWinning ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`} style={{ width: `${percentage}%` }} />
                )}
                <div className="relative p-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                     {voting ? (
                       <Loader2 size={20} className="animate-spin text-slate-400" />
                     ) : hasVoted && isSelected ? (
                       <CheckCircle2 size={20} className="text-indigo-400" />
                     ) : null}
                     <span className={`font-medium text-lg ${hasVoted && isWinning ? 'text-emerald-300' : 'text-slate-200'}`}>{option.text}</span>
                     {hasVoted && isWinning && <Crown size={20} className="text-yellow-400 fill-yellow-400" />}
                  </div>
                  {hasVoted && (
                    <div className="text-right">
                      <span className="block text-lg font-bold text-white">{percentage}%</span>
                      <span className="text-xs text-slate-400">{option.votes} votes</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-center text-slate-500 text-sm">
          <span>Total Votes: {totalVotes}</span>
          <span>Rank Score: {poll.upvotes}</span>
        </div>
      </div>
    </div>
  );
};
