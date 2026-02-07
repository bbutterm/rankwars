import React, { useEffect, useState } from 'react';
import { NavigationProps, Poll } from '../types';
import { getPolls, approvePoll, deletePoll } from '../services/storage';
import { Button } from '../components/Button';
import { ArrowLeft, Check, X, Clock, ShieldAlert, ListFilter, Trash2 } from 'lucide-react';
import { toast } from '../components/Toast';

interface AdminProps extends NavigationProps {}

type AdminTab = 'PENDING' | 'ALL';

export const Admin: React.FC<AdminProps> = ({ setView }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [tab, setTab] = useState<AdminTab>('PENDING');

  useEffect(() => {
    loadPolls();
  }, [tab]);

  const loadPolls = () => {
    const all = getPolls();
    // Sort by newest first
    const sorted = all.sort((a, b) => b.createdAt - a.createdAt);
    
    if (tab === 'PENDING') {
      setPolls(sorted.filter(p => p.status === 'pending'));
    } else {
      setPolls(sorted);
    }
  };

  const handleApprove = (id: string) => {
    approvePoll(id);
    toast("Poll approved! It is now live.", "success");
    loadPolls();
  };

  const handleDelete = (id: string, isReject = false) => {
    // Removed window.confirm causing issues. Actions are reversible if we had undo, 
    // but for MVP immediate action is snappier.
    deletePoll(id);
    toast(isReject ? "Poll rejected." : "Poll deleted.", "info");
    loadPolls();
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <button 
            onClick={() => setView('HOME')}
            className="flex items-center text-slate-400 hover:text-white transition-colors"
        >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
        </button>
        
        <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 self-start md:self-auto">
           <button 
             onClick={() => setTab('PENDING')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${tab === 'PENDING' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
           >
             <ShieldAlert size={16} /> Pending
           </button>
           <button 
             onClick={() => setTab('ALL')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${tab === 'ALL' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
           >
             <ListFilter size={16} /> All Polls
           </button>
        </div>
      </div>

      <div className="space-y-6">
        {polls.length === 0 ? (
            <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                <Check size={48} className="mx-auto mb-4 text-emerald-500/50" />
                <h3 className="text-xl font-bold text-white mb-2">No Polls Found</h3>
                <p className="text-slate-400">
                    {tab === 'PENDING' ? 'There are no pending polls to review.' : 'The database is empty.'}
                </p>
            </div>
        ) : (
            polls.map(poll => (
                <div key={poll.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg animate-fade-up">
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                {poll.status === 'pending' ? (
                                    <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-0.5 rounded border border-yellow-500/20 uppercase font-bold tracking-wider">
                                        Pending
                                    </span>
                                ) : (
                                    <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-bold tracking-wider">
                                        Approved
                                    </span>
                                )}
                                <span className="text-slate-500 text-xs flex items-center gap-1">
                                    <Clock size={12} />
                                    {new Date(poll.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{poll.title}</h3>
                            <p className="text-slate-400 text-sm">{poll.description}</p>
                        </div>
                    </div>

                    {/* Quick Preview of Details */}
                    <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-700/50">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {poll.tags?.map(t => (
                                <span key={t} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">#{t}</span>
                            ))}
                        </div>
                        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                            {poll.options.map(opt => (
                                <li key={opt.id}>{opt.text} <span className="text-slate-600 ml-2">({opt.votes} votes)</span></li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button 
                            variant="danger" 
                            onClick={() => handleDelete(poll.id, true)}
                            className="flex items-center gap-2"
                        >
                            {tab === 'PENDING' ? <><X size={18} /> Decline</> : <><Trash2 size={18} /> Delete</>}
                        </Button>
                        
                        {poll.status === 'pending' && (
                            <Button 
                                variant="primary" 
                                onClick={() => handleApprove(poll.id)}
                                className="!bg-emerald-600 hover:!bg-emerald-500 !shadow-emerald-500/30 flex items-center gap-2"
                            >
                                <Check size={18} /> Approve
                            </Button>
                        )}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};