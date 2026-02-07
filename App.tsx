import React, { useState } from 'react';
import { ViewState } from './types';
import { Home } from './pages/Home';
import { PollView } from './pages/PollView';
import { Admin } from './pages/Admin';
import { CreatePoll } from './pages/CreatePoll';
import { Toaster } from './components/Toast';

const App: React.FC = () => {
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
          
          <div className="flex gap-4">
             {currentView !== 'CREATE_POLL' && (
                <button 
                  onClick={() => setView('CREATE_POLL')}
                  className="hidden md:block text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Create Poll
                </button>
             )}
             {currentView !== 'ADMIN' && (
                <button 
                  onClick={() => setView('ADMIN')}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Moderation
                </button>
             )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-12">
        {renderView()}
      </main>
    </div>
  );
};

export default App;