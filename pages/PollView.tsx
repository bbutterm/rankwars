import React, { useEffect, useState } from 'react';
import { Poll, NavigationProps } from '../types';
import { getPolls, voteInPollStorage, hasUserVotedInPoll } from '../services/storage';
import { ArrowLeft, Share2, CheckCircle2, Crown, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from '../components/Toast';

interface PollViewProps extends NavigationProps {}

export const PollView: React.FC<PollViewProps> = ({ activePollId, setView }) => {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    loadData();
  }, [activePollId]);

  const loadData = async () => {
    if (!activePollId) {
      setView('HOME');
      return;
    }
    setLoading(true);
    const allPolls = await getPolls();
    const found = allPolls.find(p => p.id === activePollId);
    
    setPoll(found || null);
    setHasVoted(hasUserVotedInPoll(activePollId));
    setLoading(false);
  };

  const handleVote = async (optionId: string) => {
    if (!poll || hasVoted) return;
    
    const success = await voteInPollStorage(poll.id, optionId);
    if (success) {
      setSelectedOption(optionId);
      setHasVoted(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast("Vote recorded! 🎉");
      loadData(); // Refresh counts
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
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
                onClick={() => !hasVoted && handleVote(option.id)}
                className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer ${hasVoted ? 'border-transparent bg-slate-700/30 cursor-default' : 'border-slate-600 hover:border-indigo-500 hover:bg-slate-700/50 bg-slate-700/20'} ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
              >
                {hasVoted && (
                  <div className={`absolute inset-0 h-full transition-all duration-1000 ease-out ${isWinning ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`} style={{ width: `${percentage}%` }} />
                )}
                <div className="relative p-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                     {hasVoted && isSelected && <CheckCircle2 size={20} className="text-indigo-400" />}
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