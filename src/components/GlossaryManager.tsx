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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">Glossary Manager</h2>
            </div>
            <p className="text-xs text-slate-400">{book.title}</p>
          </div>
        </div>

        <button
          onClick={handleTriggerReGen}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors shadow-md shadow-purple-600/20"
        >
          <Sparkles className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Auto-Extract Key Terms
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
        {/* Search & Stats */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search terms or definitions..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-semibold bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            Total Terms: <strong className="text-white">{glossary.length}</strong>
          </span>
        </div>

        {/* Add New Term Card */}
        <form onSubmit={handleAddSubmit} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Add New Glossary Term</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                required
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Term (e.g. Chloroplast)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                value={newDefinition}
                onChange={(e) => setNewDefinition(e.target.value)}
                placeholder="Definition explanation..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAdding}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Term
            </button>
          </div>
        </form>

        {/* Glossary Terms List */}
        <div className="space-y-3">
          {filteredGlossary.length === 0 ? (
            <div className="text-center py-12 bg-slate-950 rounded-2xl border border-slate-800 text-slate-400">
              <p className="text-sm">No glossary terms found.</p>
            </div>
          ) : (
            filteredGlossary.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start justify-between gap-4 group"
              >
                {editingId === item.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editTermStr}
                      onChange={(e) => setEditTermStr(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-bold"
                    />
                    <textarea
                      rows={2}
                      value={editDefStr}
                      onChange={(e) => setEditDefStr(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-xs border border-slate-700 rounded text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-blue-300">{item.term}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.definition}</p>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTerm(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded"
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
