import React, { useState } from 'react';
import { X, Save, UserCheck, Image } from 'lucide-react';
import { Author } from '../types';

interface AuthorProfileModalProps {
  author: Author;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAuthor: Partial<Author>) => void;
}

export const AuthorProfileModal: React.FC<AuthorProfileModalProps> = ({
  author,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(author.name);
  const [credentials, setCredentials] = useState(author.credentials);
  const [bio, setBio] = useState(author.bio);
  const [photoUrl, setPhotoUrl] = useState(author.photo_url || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      credentials,
      bio,
      photo_url: photoUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel bg-[#0b0f19] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/10 animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/10 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base font-display text-white">Author Profile Setup</h2>
          </div>
          <button
            onClick={onClose}
            id="close-author-modal"
            className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Author Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Evelyn Vance"
              className="w-full px-3.5 py-2.5 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Professional Credentials *</label>
            <input
              type="text"
              required
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              placeholder="e.g. M.Ed. Senior Science Educator & Curriculum Specialist"
              className="w-full px-3.5 py-2.5 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Photo / Avatar URL</label>
            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt="Avatar preview"
                  className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">About the Author Bio *</label>
            <textarea
              rows={4}
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Provide a brief background that will appear on the 'About the Author' page in exported textbooks..."
              className="w-full p-3 bg-slate-900/90 text-slate-100 placeholder:text-slate-500 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 text-slate-300 rounded-full hover:bg-white/10 transition-colors font-medium btn-glass"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-author-btn"
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 font-semibold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
