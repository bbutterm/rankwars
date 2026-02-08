import React, { useEffect, useState } from 'react';
import { NavigationProps, Poll } from '../types';
import { getPolls, approvePoll, deletePoll, seedTestData } from '../services/storage';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Button } from '../components/Button';
import { ArrowLeft, Check, ShieldAlert, Trash2, LogIn, Loader2, Database, Mail, Lock, UserPlus, DatabaseZap, ShieldBan, LogOut, Crown } from 'lucide-react';
import { toast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

interface AdminProps extends NavigationProps {}

export const Admin: React.FC<AdminProps> = ({ setView }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [tab, setTab] = useState<'PENDING' | 'ALL'>('PENDING');
  const [loading, setLoading] = useState(true);
  
  // Auth state from context
  const { user, isAdmin, isLoading: authLoading, signOut, refreshUser } = useAuth();
  
  // Login form state
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('admin@admin.ru'); 
  const [password, setPassword] = useState('adminadmin');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isMakingAdmin, setIsMakingAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Load polls if user is admin
    if (isAdmin && user) {
      loadPolls();
    } else if (user) {
      setLoading(false);
    }
  }, [tab, user, isAdmin]);

  const loadPolls = async () => {
    setLoading(true);
    try {
      const all = await getPolls();
      if (tab === 'PENDING') {
        setPolls(all.filter(p => p.status === 'pending'));
      } else {
        setPolls(all);
      }
    } catch (err) {
      console.error(err);
      toast("Failed to load polls", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const result = await approvePoll(id);
    if (result.success) {
      toast("Poll approved!", "success");
      loadPolls();
    } else {
      toast(result.error || "Failed to approve poll", "error");
    }
  };

  const handleReject = async (id: string) => {
    const result = await deletePoll(id);
    if (result.success) {
      toast("Poll rejected/deleted.", "info");
      loadPolls();
    } else {
      toast(result.error || "Failed to delete poll", "error");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email || !password) return;
    
    setIsAuthLoading(true);
    
    try {
      if (authMode === 'LOGIN') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast("Login successful!", "success");
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
        });

        if (error) {
           if (error.message.includes("already registered") || error.status === 422) {
              toast("User exists. Logging in...", "info");
              const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
              if (loginErr) throw loginErr;
              return; 
           }
           throw error;
        }

        if (data.session) {
           toast("Account created & Logged in!", "success");
        } else if (data.user) {
           toast("Account created. Check email if login didn't happen automatically.", "info");
           await supabase.auth.signInWithPassword({ email, password });
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      toast(err.message || "Authentication failed", "error");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    const success = await seedTestData();
    setIsSeeding(false);
    if (success) {
      toast("Test data added! 🎉");
      loadPolls();
    } else {
      toast("Failed to seed. Check console for RLS errors.", "error");
    }
  };

  const handleMakeAdmin = async () => {
    if (!supabase) return;
    setIsMakingAdmin(true);
    
    try {
      const { data, error } = await supabase.rpc('make_myself_admin');
      
      if (error) {
        toast(error.message || "Failed to make admin", "error");
      } else if (data?.success) {
        toast("You are now an admin! 🎉", "success");
        await refreshUser();
      } else {
        toast(data?.error || "Failed to make admin", "error");
      }
    } catch (err: any) {
      console.error("Error making admin:", err);
      toast(err.message || "Failed to make admin", "error");
    } finally {
      setIsMakingAdmin(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="max-w-md mx-auto py-20 text-center animate-fade-in">
        <Database size={64} className="mx-auto text-amber-500 mb-6" />
        <h2 className="text-3xl font-bold mb-4">Database Offline</h2>
        <p className="text-slate-400 mb-8">
          Admin features require a Supabase connection.
        </p>
        <button onClick={() => setView('HOME')} className="text-indigo-400 hover:underline">Return Home</button>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Loading...</p>
      </div>
    );
  }

  // Not Logged In -> Show Login Form
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 animate-fade-in">
        <div className="text-center mb-8">
          <ShieldAlert size={64} className="mx-auto text-indigo-500 mb-6" />
          <h2 className="text-3xl font-bold mb-2">Admin Panel</h2>
          <p className="text-slate-400">Login to manage polls.</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="flex border-b border-slate-700">
            <button 
              onClick={() => setAuthMode('LOGIN')}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${authMode === 'LOGIN' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setAuthMode('SIGNUP')}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${authMode === 'SIGNUP' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Register
            </button>
          </div>
          
          <form onSubmit={handleAuth} className="p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@admin.ru"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full py-3" 
              isLoading={isAuthLoading}
            >
              {authMode === 'LOGIN' ? <LogIn size={20} className="mr-2" /> : <UserPlus size={20} className="mr-2" />}
              {authMode === 'LOGIN' ? 'Login' : 'Create Account'}
            </Button>
            
            <p className="text-xs text-center text-slate-500 mt-4">
              {authMode === 'SIGNUP' && "Make sure 'Confirm Email' is disabled in Supabase for instant login."}
            </p>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          <button onClick={() => setView('HOME')} className="text-slate-500 hover:text-white text-sm flex items-center justify-center mx-auto">
            <ArrowLeft size={16} className="mr-1" /> Back to RankWars
          </button>
        </div>
      </div>
    );
  }

  // Logged In BUT NOT Admin -> Show "Become Admin" button or Access Denied
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 animate-fade-in text-center">
         <ShieldBan size={64} className="mx-auto text-amber-500 mb-6" />
         <h2 className="text-3xl font-bold mb-4">Admin Access Required</h2>
         <p className="text-slate-400 mb-2">
            You are logged in as <span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded">{user.email}</span>.
         </p>
         <p className="text-slate-500 mb-8 text-sm">
            This area is restricted to administrators only.
         </p>
         
         <div className="flex flex-col gap-3">
             <Button variant="primary" onClick={handleMakeAdmin} isLoading={isMakingAdmin}>
                <Crown size={18} className="mr-2" /> Make Me Admin
             </Button>
             <Button variant="secondary" onClick={signOut}>
                <LogOut size={18} className="mr-2" /> Logout
             </Button>
             <button onClick={() => setView('HOME')} className="text-indigo-400 hover:underline mt-2">
                Return to Home
             </button>
         </div>
      </div>
    );
  }

  // Logged In AND Admin -> Show Admin Dashboard
  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('HOME')} className="text-slate-400 hover:text-white flex items-center transition-colors">
              <ArrowLeft size={20} className="mr-2" /> Back
          </button>
          <Button variant="secondary" size="sm" onClick={handleSeed} isLoading={isSeeding} className="!py-1.5">
            <DatabaseZap size={16} className="mr-2" /> Seed Data
          </Button>
        </div>
        <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
           <button onClick={() => setTab('PENDING')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'PENDING' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Pending</button>
           <button onClick={() => setTab('ALL')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'ALL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>All Polls</button>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-emerald-400">Admin Access</span>
            <span className="text-[10px] text-slate-500">{user.email}</span>
          </div>
          <button onClick={signOut} className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">Logout</button>
        </div>
      </div>

      {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Loading polls...</p>
          </div>
      ) : polls.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700 text-slate-400">
            <Check className="mx-auto mb-2 opacity-20" size={48} />
            <p>No polls found. Try clicking "Seed Data"!</p>
          </div>
      ) : (
          <div className="grid gap-6">
            {polls.map(poll => (
                <div key={poll.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg hover:border-slate-600 transition-colors">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                          <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${poll.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                    {poll.status}
                                </span>
                                <span className="text-xs text-slate-500">{new Date(poll.created_at).toLocaleDateString()}</span>
                              </div>
                              <h3 className="text-xl font-bold text-white truncate">{poll.title}</h3>
                              <p className="text-slate-400 text-sm mt-1 line-clamp-2">{poll.description || "No description provided."}</p>
                          </div>
                      </div>
                      
                      <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-slate-500 mb-2 uppercase font-bold tracking-widest">Options ({poll.options?.length || 0})</p>
                        <div className="flex flex-wrap gap-2">
                          {poll.options?.map(opt => (
                            <span key={opt.id} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">{opt.text}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-2">
                          <Button variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={() => handleReject(poll.id)}>
                            <Trash2 size={18} className="mr-2" /> Delete
                          </Button>
                          {poll.status === 'pending' && (
                            <Button variant="primary" onClick={() => handleApprove(poll.id)}>
                              <Check size={18} className="mr-2" /> Approve
                            </Button>
                          )}
                      </div>
                    </div>
                </div>
            ))}
          </div>
      )}
    </div>
  );
};