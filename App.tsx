import React, { useState } from 'react';
import { ViewState } from './types';
import { Home } from './pages/Home';
import { PollView } from './pages/PollView';
import { Admin } from './pages/Admin';
import { CreatePoll } from './pages/CreatePoll';
import { Toaster } from './components/Toast';
import { isSupabaseConfigured } from './services/supabase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlertCircle, Database, User, LogOut, Shield } from 'lucide-react';

// ============================================================
// Navigation Component
// ============================================================

const Navigation: React.FC<{
  currentView: ViewState;
  setView: (view: ViewState) => void;
}> = ({ currentView, setView }) => {
  const { user, isAdmin, isLoading, signOut } = useAuth();

  return (
    <nav className="relative z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          onClick={() => setView('HOME')} 
          className="font-bold text-xl cursor-pointer tracking-tight flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center transform rotate-3">
            <span className="text-white font-black text-lg">R</span>
          </div>
          RankWars
        </div>
        
        <div className="flex gap-4 items-center">
          {!isSupabaseConfigured && (
            <div className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 mr-2" title="Supabase keys missing">
              <AlertCircle size={14} />
              <span className="hidden sm:inline">No DB</span>
            </div>
          )}
          
          {currentView !== 'CREATE_POLL' && (
            <button 
              onClick={() => setView('CREATE_POLL')}
              className="hidden md:block text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Create Poll
            </button>
          )}
          
          {currentView !== 'ADMIN' && isAdmin && (
            <button 
              onClick={() => setView('ADMIN')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Shield size={14} />
              Admin
            </button>
          )}
          
          {user && !isLoading && (
            <div className="flex items-center gap-2 ml-2">
              <div className="hidden sm:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg">
                <User size={14} className="text-slate-400" />
                <span className="text-sm text-slate-300">
                  {user.email?.split('@')[0]}
                </span>
                {isAdmin && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-medium">ADMIN</span>
                )}
              </div>
              <button 
                onClick={signOut}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// ============================================================
// Main App Component
// ============================================================

const AppContent: React.FC = () => {
  const [currentView, setView] = useState<ViewState>('HOME');
  const [activePollId, setPollId] = useState<string | null>(null);

  const renderView = () => {
    const props = {
      currentView,
      setView,
      activePollId,
      setPollId
    };

    switch (currentView) {
      case 'HOME':
        return <Home {...props} />;
      case 'POLL_DETAILS':
        return <PollView {...props} />;
      case 'ADMIN':
        return <Admin {...props} />;
      case 'CREATE_POLL':
        return <CreatePoll {...props} />;
      default:
        return <Home {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Toaster />
      
      {/* Background Gradient Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-900/20 rounded-full blur-3xl opacity-50"></div>
      </div>

      <Navigation currentView={currentView} setView={setView} />

      {!isSupabaseConfigured && (
        <div className="relative z-20 max-w-5xl mx-auto px-4 pt-4">
          <div className="bg-amber-600/10 border border-amber-600/20 text-amber-400 p-3 rounded-lg flex items-center gap-3 text-sm">
            <Database size={18} className="flex-shrink-0" />
            <p>
              <strong>Supabase not connected.</strong> Data persistence is disabled. Check <code>SERVER_PLAN.md</code> to set up your database.
            </p>
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        {renderView()}
      </main>
    </div>
  );
};

// Wrap AppContent with AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
