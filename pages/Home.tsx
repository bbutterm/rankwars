import React, { useEffect, useState, useMemo } from 'react';
import { Poll, NavigationProps } from '../types';
import { getPolls, upvotePollInStorage, hasUserUpvoted } from '../services/storage';
import { ArrowBigUp, MessageCircle, Trophy, Flame, Clock, Search, Hash, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import confetti from 'canvas-confetti';

interface HomeProps extends NavigationProps {}

type SortMode = 'HOT' | 'NEW';

export const Home: React.FC<HomeProps> = ({ setView, setPollId }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('HOT');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [userUpvotes, setUserUpvotes] = useState<string[]>([]);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    setLoading(true);
    const data = await getPolls();
    // Only show APPROVED polls on home page
    const approved = data.filter(p => p.status === 'approved');
    setPolls(approved);
    
    // Check local storage for UI state
    const upvotedIds = approved.filter(p => hasUserUpvoted(p.id)).map(p => p.id);
    setUserUpvotes(upvotedIds);
    setLoading(false);
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    polls.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [polls]);

  const filteredPolls = useMemo(() => {
    let result = [...polls];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (selectedTag) {
      result = result.filter(p => p.tags?.includes(selectedTag));
    }
    if (sortMode === 'HOT') {
      result.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      // Use created_at for sorting, falling back to legacy createdAt
      result.sort((a, b) => {
        const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
        const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
        return dateB - dateA;
      });
    }
    return result;
  }, [polls, searchQuery, selectedTag, sortMode]);

  const handleRankVote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (hasUserUpvoted(id)) return;

    const success = await upvotePollInStorage(id);
    if (success) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight },
      });
      loadPolls();
    }
  };

  const handleOpenPoll = (id: string) => {
    setPollId(id);
    setView('POLL_DETAILS');
  };

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
      e.stopPropagation();
      setSelectedTag(tag === selectedTag ? null : tag);
  };

  if (loading && polls.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p>Fetching the latest battles...</p>
          </div>
      );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20">
      <header className="text-center space-y-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
          RankWars
        </h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">
          Vote for the best topics, or settle the debate once and for all.
        </p>
      </header>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text"
            placeholder="Search polls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm backdrop-blur-sm"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
             <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${!selectedTag ? 'bg-slate-100 text-slate-900 border-slate-100' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
             >
                All
             </button>
             {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${selectedTag === tag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                >
                  #{tag}
                </button>
             ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-4">
        <h2 className="text-slate-300 font-semibold text-lg flex items-center gap-2">
           {searchQuery ? 'Search Results' : 'Trending Polls'}
           <span className="text-slate-600 text-sm font-normal">({filteredPolls.length})</span>
        </h2>
        <div className="bg-slate-800/80 p-1 rounded-lg flex gap-1 border border-slate-700">
          <button onClick={() => setSortMode('HOT')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${sortMode === 'HOT' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
            <Flame size={14} /> Hot
          </button>
          <button onClick={() => setSortMode('NEW')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${sortMode === 'NEW' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
            <Clock size={14} /> New
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredPolls.map((poll, index) => {
           const isUpvoted = userUpvotes.includes(poll.id);
           return (
            <div key={poll.id} onClick={() => handleOpenPoll(poll.id)} className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 rounded-xl p-5 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-indigo-500/10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 text-center pt-1">
                  {sortMode === 'HOT' && !searchQuery && !selectedTag && index === 0 && <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-1" />}
                  {sortMode === 'HOT' && !searchQuery && !selectedTag ? (
                    <span className={`text-xl font-bold ${index < 3 ? 'text-white' : 'text-slate-500'}`}>#{index + 1}</span>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto"><Hash size={16} className="text-slate-500" /></div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors truncate max-w-full">{poll.title}</h3>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{poll.description}</p>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1"><MessageCircle size={14} /> {poll.options?.reduce((acc, opt) => acc + opt.votes, 0) || 0} votes</span>
                    <span>•</span>
                    <span>{new Date(poll.created_at || poll.createdAt || 0).toLocaleDateString()}</span>
                    {poll.tags && poll.tags.length > 0 && (
                        <div className="flex gap-2 ml-auto">
                            {poll.tags.slice(0, 2).map(t => (
                                <button key={t} onClick={(e) => handleTagClick(e, t)} className="bg-slate-700/50 hover:bg-indigo-600/50 hover:text-white transition-colors px-2 py-0.5 rounded text-slate-400">#{t}</button>
                            ))}
                        </div>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-center pl-2">
                  <button onClick={(e) => handleRankVote(e, poll.id)} disabled={isUpvoted} className={`flex flex-col items-center gap-1 transition-all p-2 rounded-lg min-w-[50px] ${isUpvoted ? 'text-indigo-400 bg-indigo-500/10 cursor-default' : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50'}`}>
                    <ArrowBigUp size={32} className={poll.upvotes > 0 || isUpvoted ? "fill-current" : ""} />
                    <span className="font-bold text-sm">{poll.upvotes}</span>
                  </button>
                </div>
              </div>
            </div>
           );
        })}
      </div>

      <div className="fixed bottom-6 right-6 z-50">
         <Button onClick={() => setView('CREATE_POLL')} className="rounded-full w-14 h-14 !p-0 shadow-xl shadow-indigo-600/40">
            <span className="text-2xl">+</span>
         </Button>
      </div>
    </div>
  );
};