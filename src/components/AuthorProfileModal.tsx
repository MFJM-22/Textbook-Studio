import React, { useState, useRef } from 'react';
import { X, Save, UserCheck, Upload, Trash2, Camera } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Please select an image smaller than 5MB.');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setPhotoUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 flex items-center justify-between text-xs">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">Author Name</label>
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
            <label className="block font-bold text-slate-300 mb-1.5">Professional Credentials</label>
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
            <label className="block font-bold text-slate-300 mb-1.5">Author Photo</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-3 p-3 bg-slate-900/80 border border-white/10 rounded-2xl">
              <div className="relative group shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Author profile"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Photo
                  </button>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Upload an image from your device (PNG, JPG, WebP) or paste an image URL below.
                </p>
              </div>
            </div>

            <div className="mt-2">
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Or paste image URL (https://...)"
                className="w-full px-3.5 py-2 bg-slate-900/60 text-slate-300 text-[11px] placeholder:text-slate-500 border border-white/10 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">About the Author Bio</label>
            <textarea
              rows={3}
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
