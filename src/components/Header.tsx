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
}

export const Header: React.FC<HeaderProps> = ({
  author,
  onOpenAuthorProfile,
  onNewBook,
  onOpenAuth,
}) => {
  const { currentUser, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Textbook Studio
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                v2 AI Studio
              </span>
            </h1>
            <p className="text-xs text-slate-400">Automated Teacher Notes to Published Textbook</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1">
              <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 text-xs font-bold">
                {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : <Shield className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs text-slate-300 hidden md:inline max-w-[130px] truncate">
                {currentUser.email}
              </span>
              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
              Sign In / Register
            </button>
          )}

          <button
            onClick={onOpenAuthorProfile}
            id="author-profile-btn"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline max-w-[120px] truncate">{author.name || 'Author Profile'}</span>
          </button>

          <button
            onClick={onNewBook}
            id="new-book-btn"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Textbook
          </button>
        </div>
      </div>
    </header>
  );
};

