import React, { useState } from 'react';
import { BookMarked, Plus, Trash2, Edit2, Search, ArrowLeft, Save, Sparkles } from 'lucide-react';
import { Book, GlossaryTerm } from '../types';

interface GlossaryManagerProps {
  book: Book;
  glossary: GlossaryTerm[];
  onBack: () => void;
  onAddTerm: (term: string, definition: string) => Promise<void>;
  onUpdateTerm: (id: string, term: string, definition: string) => Promise<void>;
  onDeleteTerm: (id: string) => Promise<void>;
  onReGenerate: () => Promise<void>;
}

export const GlossaryManager: React.FC<GlossaryManagerProps> = ({
  book,
  glossary,
  onBack,
  onAddTerm,
  onUpdateTerm,
  onDeleteTerm,
  onReGenerate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTermStr, setEditTermStr] = useState('');
  const [editDefStr, setEditDefStr] = useState('');

  // New term form
  const [newTerm, setNewTerm] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const filteredGlossary = glossary
    .filter(
      (g) =>
        g.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.definition.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.term.localeCompare(b.term));

  const handleStartEdit = (item: GlossaryTerm) => {
    setEditingId(item.id);
    setEditTermStr(item.term);
    setEditDefStr(item.definition);
  };

  const handleSaveEdit = async (id: string) => {
    await onUpdateTerm(id, editTermStr, editDefStr);
    setEditingId(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm || !newDefinition) return;
    setIsAdding(true);
    await onAddTerm(newTerm, newDefinition);
    setNewTerm('');
    setNewDefinition('');
    setIsAdding(false);
  };

  const handleTriggerReGen = async () => {
    setIsRegenerating(true);
    await onReGenerate();
    setIsRegenerating(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors border border-slate-200/60"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Glossary Manager</h2>
            </div>
            <p className="text-xs text-slate-500">{book.title}</p>
          </div>
        </div>

        <button
          onClick={handleTriggerReGen}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all shadow-xs"
        >
          <Sparkles className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Auto-Extract Key Terms
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
        {/* Search & Stats */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search terms or definitions..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-full text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-xs"
            />
          </div>
          <span className="text-xs text-slate-600 font-semibold bg-white px-4 py-2.5 rounded-full border border-slate-200/80 shadow-xs">
            Total Terms: <strong className="text-slate-900 font-bold">{glossary.length}</strong>
          </span>
        </div>

        {/* Add New Term Card */}
        <form onSubmit={handleAddSubmit} className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Add New Glossary Term</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                required
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Term (e.g. Chloroplast)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                value={newDefinition}
                onChange={(e) => setNewDefinition(e.target.value)}
                placeholder="Definition explanation..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAdding}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Term
            </button>
          </div>
        </form>

        {/* Glossary Terms List */}
        <div className="space-y-3">
          {filteredGlossary.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 text-slate-500">
              <p className="text-sm">No glossary terms found.</p>
            </div>
          ) : (
            filteredGlossary.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 flex items-start justify-between gap-4 group shadow-xs hover:border-slate-300 transition-colors"
              >
                {editingId === item.id ? (
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={editTermStr}
                      onChange={(e) => setEditTermStr(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 font-bold"
                    />
                    <textarea
                      rows={2}
                      value={editDefStr}
                      onChange={(e) => setEditDefStr(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-1.5 text-xs border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-indigo-950">{item.term}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.definition}</p>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTerm(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
