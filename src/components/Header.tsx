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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md text-slate-900 border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2.5 sm:py-0 flex items-center justify-between flex-wrap sm:flex-nowrap gap-3">
        
        {/* Brand Logo & Title */}
        <div
          onClick={() => onToggleLandingPage(true)}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/15 group-hover:scale-105 transition-transform shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 flex items-center gap-2 leading-tight">
              Textbook Studio
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 shrink-0">
                AI Studio
              </span>
            </h1>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">

          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200 rounded-full px-3 py-1">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs">
                {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : <Shield className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs font-medium text-slate-700 hidden md:inline max-w-[130px] truncate">
                {currentUser.email}
              </span>
              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded-full transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-full transition-all min-h-[38px]"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sign In</span>
            </button>
          )}

          {!showLandingPage && (
            <button
              onClick={onOpenAuthorProfile}
              id="author-profile-btn"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-full transition-all min-h-[38px]"
            >
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline max-w-[100px] md:max-w-[120px] truncate">{author.name || 'Author'}</span>
            </button>
          )}

          {!showLandingPage && (
            <button
              onClick={onNewBook}
              id="new-book-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-md shadow-indigo-600/20 transition-all min-h-[38px]"
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

