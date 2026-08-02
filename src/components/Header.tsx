import React from 'react';
import { BookOpen, User, Plus, LogOut, LogIn, Shield } from 'lucide-react';
import { Author } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  author: Author;
  onOpenAuthorProfile: () => void;
  onNewBook: () => void;
  onLoadSample: () => void;
  onOpenAuth: () => void;
  showLandingPage: boolean;
  onToggleLandingPage: (showLanding: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  author,
  onOpenAuthorProfile,
  onNewBook,
  onOpenAuth,
  showLandingPage,
  onToggleLandingPage,
}) => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2.5 sm:py-0 flex items-center justify-between flex-wrap sm:flex-nowrap gap-3">
        
        {/* Brand Logo & Title */}
        <div
          onClick={() => onToggleLandingPage(true)}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 leading-tight">
              Textbook Studio
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50 shrink-0">
                v2 AI Studio
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block sm:block">Automated Teacher Notes to Published Textbook</p>
          </div>
        </div>

        {/* Center Nav Pills */}
        <div className="hidden md:flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onToggleLandingPage(true)}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              showLandingPage
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview & Features
          </button>
          <button
            onClick={() => onToggleLandingPage(false)}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
              !showLandingPage
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Textbook Projects
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
          {/* Mobile view switch */}
          <button
            onClick={() => onToggleLandingPage(!showLandingPage)}
            className="md:hidden px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
          >
            {showLandingPage ? 'Projects' : 'Home'}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1">
              <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : <Shield className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs text-slate-300 hidden md:inline max-w-[130px] truncate">
                {currentUser.email}
              </span>
              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors min-h-[38px]"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={onOpenAuthorProfile}
            id="author-profile-btn"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors min-h-[38px]"
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline max-w-[100px] md:max-w-[120px] truncate">{author.name || 'Author'}</span>
          </button>

          <button
            onClick={onNewBook}
            id="new-book-btn"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20 transition-colors min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Create Textbook</span>
            <span className="xs:hidden sm:hidden">Create</span>
          </button>
        </div>
      </div>
    </header>
  );
};

