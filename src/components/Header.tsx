import React from 'react';
import { BookOpen, User, Plus, LogOut, LogIn, Shield, Sparkles } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-[#07090e]/80 backdrop-blur-2xl text-slate-100 border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div
          onClick={() => onToggleLandingPage(true)}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:scale-105 group-hover:bg-emerald-500/20 transition-all shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-display flex items-center gap-2.5 leading-none">
              <span className="bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                Textbook Studio
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full glass-pill border border-emerald-500/30 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" /> AI Studio
              </span>
            </h1>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-auto">

          {currentUser ? (
            <div className="flex items-center gap-2.5 glass-panel rounded-full px-3.5 py-1.5 border border-white/10">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : <Shield className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs font-medium text-slate-300 hidden md:inline max-w-[130px] truncate">
                {currentUser.email}
              </span>
              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-1 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 btn-glass hover:text-white transition-all min-h-[38px]"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sign In</span>
            </button>
          )}

          {!showLandingPage && (
            <button
              onClick={onOpenAuthorProfile}
              id="author-profile-btn"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 btn-glass transition-all min-h-[38px]"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline max-w-[100px] md:max-w-[120px] truncate">{author.name || 'Author'}</span>
            </button>
          )}

          {!showLandingPage && (
            <button
              onClick={onNewBook}
              id="new-book-btn"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold btn-emerald transition-all min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">Create Textbook</span>
              <span className="xs:hidden sm:hidden">Create</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


