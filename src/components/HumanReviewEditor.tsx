import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Table as TableIcon,
  CheckCircle,
  GripVertical,
  Layers,
  Sparkles,
  Eye,
  Edit3,
  Split,
  Combine,
  Save,
  Loader2,
} from 'lucide-react';
import { Book, Week, ContentSection } from '../types';
import { parseMarkdownTable, parseParagraphBlocks, normalizeContentSections } from '../lib/docGenerator';

interface HumanReviewEditorProps {
  book: Book;
  weeks: Week[];
  onBack: () => void;
  onSaveWeeks: (updatedWeeks: Week[]) => Promise<void>;
  onApproveAndContinue: () => Promise<void>;
}

export const HumanReviewEditor: React.FC<HumanReviewEditorProps> = ({
  book,
  weeks,
  onBack,
  onSaveWeeks,
  onApproveAndContinue,
}) => {
  const [weeksList, setWeeksList] = useState<Week[]>(() => {
    if (weeks && weeks.length > 0) {
      return weeks.map((w) => ({
        ...w,
        content_json: normalizeContentSections(w.content_json || []),
      }));
    }
    return [
      {
        id: `w-def-${Date.now()}`,
        book_id: book.id,
        week_number: 1,
        topic: `${book.title || book.subject || 'Lesson Unit'}`,
        content_json: [
          {
            subheading: 'Unit Overview & Key Topics',
            paragraphs: [`Transcribed content for ${book.title || 'this textbook'}.`],
          },
        ],
        created_at: new Date().toISOString(),
      },
    ];
  });

  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [mobileTab, setMobileTab] = useState<'weeks' | 'editor'>('editor');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  // Sync weeks state if incoming prop updates initially or if book ID changes
  const lastSyncedWeeksRef = React.useRef<string>('');
  useEffect(() => {
    const serialized = JSON.stringify(weeks || []);
    if (weeks && weeks.length > 0 && serialized !== lastSyncedWeeksRef.current) {
      lastSyncedWeeksRef.current = serialized;
      setWeeksList(
        weeks.map((w) => ({
          ...w,
          content_json: normalizeContentSections(w.content_json || []),
        }))
      );
    }
  }, [weeks]);

  const currentWeek = (weeksList && weeksList.length > 0)
    ? (weeksList[selectedWeekIndex] || weeksList[0])
    : null;

  const updateCurrentWeek = (updatedFields: Partial<Week>) => {
    if (!currentWeek) return;
    const newWeeks = [...weeksList];
    newWeeks[selectedWeekIndex] = {
      ...currentWeek,
      ...updatedFields,
    };
    setWeeksList(newWeeks);
  };

  const handleAddWeek = () => {
    const newWeekNum = weeksList.length + 1;
    const newWeek: Week = {
      id: `w-new-${Date.now()}`,
      book_id: book.id,
      week_number: newWeekNum,
      topic: `Topic ${newWeekNum}: New Unit Topic`,
      content_json: [
        {
          subheading: 'Core Concepts',
          paragraphs: ['Add lesson notes content here...'],
        },
      ],
      created_at: new Date().toISOString(),
    };
    setWeeksList([...weeksList, newWeek]);
    setSelectedWeekIndex(weeksList.length);
  };

  const handleDeleteWeek = (index: number) => {
    if (weeksList.length <= 1) return;
    const updated = weeksList.filter((_, i) => i !== index);
    // re-number
    const renumbered = updated.map((w, i) => ({ ...w, week_number: i + 1 }));
    setWeeksList(renumbered);
    setSelectedWeekIndex(Math.max(0, index - 1));
  };

  const handleMoveWeek = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === weeksList.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...weeksList];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    const renumbered = updated.map((w, i) => ({ ...w, week_number: i + 1 }));
    setWeeksList(renumbered);
    setSelectedWeekIndex(targetIdx);
  };

  const handleSplitWeek = (weekIndex: number) => {
    const w = weeksList[weekIndex];
    if (!w || w.content_json.length < 2) {
      alert('Week needs at least 2 content sections to split into two separate weeks.');
      return;
    }

    const half = Math.ceil(w.content_json.length / 2);
    const firstHalf = w.content_json.slice(0, half);
    const secondHalf = w.content_json.slice(half);

    const weekA: Week = {
      ...w,
      topic: `${w.topic} (Part 1)`,
      content_json: firstHalf,
    };

    const weekB: Week = {
      id: `w-split-${Date.now()}`,
      book_id: book.id,
      week_number: w.week_number + 1,
      topic: `${w.topic} (Part 2)`,
      content_json: secondHalf,
      created_at: new Date().toISOString(),
    };

    const updated = [...weeksList];
    updated.splice(weekIndex, 1, weekA, weekB);
    const renumbered = updated.map((item, i) => ({ ...item, week_number: i + 1 }));
    setWeeksList(renumbered);
  };

  const handleMergeNextWeek = (weekIndex: number) => {
    if (weekIndex >= weeksList.length - 1) return;
    const w1 = weeksList[weekIndex];
    const w2 = weeksList[weekIndex + 1];

    const mergedWeek: Week = {
      ...w1,
      topic: `${w1.topic} & ${w2.topic}`,
      content_json: [...w1.content_json, ...w2.content_json],
    };

    const updated = [...weeksList];
    updated.splice(weekIndex, 2, mergedWeek);
    const renumbered = updated.map((item, i) => ({ ...item, week_number: i + 1 }));
    setWeeksList(renumbered);
  };

  // Section level helpers
  const handleUpdateSection = (sIndex: number, updatedSec: Partial<ContentSection>) => {
    if (!currentWeek) return;
    const newContent = [...currentWeek.content_json];
    newContent[sIndex] = {
      ...newContent[sIndex],
      ...updatedSec,
    };
    updateCurrentWeek({ content_json: newContent });
  };

  const handleAddSection = () => {
    if (!currentWeek) return;
    const newContent = [
      ...currentWeek.content_json,
      {
        subheading: 'Subheading Title',
        paragraphs: ['Write explanatory text or add tables here.'],
      },
    ];
    updateCurrentWeek({ content_json: newContent });
  };

  const handleDeleteSection = (sIndex: number) => {
    if (!currentWeek) return;
    const newContent = currentWeek.content_json.filter((_, i) => i !== sIndex);
    updateCurrentWeek({ content_json: newContent });
  };

  const handleInsertTableSnippet = (sIndex: number) => {
    if (!currentWeek) return;
    const section = currentWeek.content_json[sIndex];
    if (!section) return;
    const tableSnippet = `\n| Item | Description | Value |\n| --- | --- | --- |\n| Example A | First sample entry | 100 |\n| Example B | Second sample entry | 200 |\n`;
    const updatedParas = [...(section.paragraphs || []), tableSnippet];
    handleUpdateSection(sIndex, { paragraphs: updatedParas });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveWeeks(weeksList);
    } catch (err) {
      console.error('Error saving weeks:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onSaveWeeks(weeksList);
      await onApproveAndContinue();
    } catch (err) {
      console.error('Error approving structure:', err);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* Top Header Gate Bar */}
      <div className="bg-[#0b0f19] border-b border-white/10 px-3 sm:px-6 py-3 sticky top-0 z-30 shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Top Row / Left Section */}
          <div className="flex items-center justify-between gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={onBack}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors shrink-0 min-h-[38px] min-w-[38px] flex items-center justify-center border border-white/10"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shrink-0">
                    Review Gate
                  </span>
                  <h2 className="text-xs sm:text-base font-bold text-white font-display truncate max-w-[110px] xs:max-w-[160px] sm:max-w-xs">
                    {book.title}
                  </h2>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 truncate mt-0.5">
                  {book.subject} • {book.class_level}
                </p>
              </div>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="flex md:hidden bg-slate-900 border border-white/10 rounded-full p-1 shrink-0">
              <button
                onClick={() => setMobileTab('weeks')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  mobileTab === 'weeks' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-400'
                }`}
              >
                Weeks ({weeksList.length})
              </button>
              <button
                onClick={() => setMobileTab('editor')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  mobileTab === 'editor' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-400'
                }`}
              >
                Edit
              </button>
            </div>
          </div>

          {/* Bottom Row / Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
            <div className="flex bg-slate-900 border border-white/10 rounded-full p-1 shrink-0">
              <button
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  viewMode === 'editor'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  viewMode === 'preview'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-full transition-colors min-h-[36px] cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save Draft</span>
                <span className="sm:hidden">Save</span>
              </button>

              <button
                onClick={handleApprove}
                disabled={isApproving}
                id="approve-and-continue-gate-btn"
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-lg shadow-indigo-600/30 transition-all min-h-[36px] whitespace-nowrap cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Approve & Continue &rarr;</span>
                <span className="xs:hidden">Approve &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Review Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar: Week Navigation & Management */}
        <div className={`w-full md:w-72 bg-[#0f172a] border-r border-white/10 p-4 flex-col justify-between overflow-y-auto ${
          mobileTab === 'weeks' ? 'flex' : 'hidden md:flex'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                Curriculum Weeks ({weeksList.length})
              </span>
              <button
                onClick={handleAddWeek}
                title="Add Week"
                className="p-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {weeksList.map((w, index) => (
                <div
                  key={w.id}
                  onClick={() => {
                    setSelectedWeekIndex(index);
                    setMobileTab('editor');
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                    selectedWeekIndex === index
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/50 border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
                      {w.week_number}
                    </span>
                    <div className="overflow-hidden">
                      <span className="block font-bold text-xs truncate text-white">
                        {w.topic || `Week ${w.week_number}`}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {w.content_json?.length || 0} sections
                      </span>
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveWeek(index, 'up');
                      }}
                      title="Move Up"
                      className="text-slate-400 hover:text-white text-xs p-1"
                    >
                      ▲
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveWeek(index, 'down');
                      }}
                      title="Move Down"
                      className="text-slate-400 hover:text-white text-xs p-1"
                    >
                      ▼
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWeek(index);
                      }}
                      title="Delete Week"
                      className="text-slate-400 hover:text-rose-400 text-xs p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
            <button
              onClick={() => handleSplitWeek(selectedWeekIndex)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-900 border border-white/10 rounded-full hover:bg-slate-800 transition-colors"
            >
              <Split className="w-3.5 h-3.5 text-amber-400" />
              Split Selected Week
            </button>
            <button
              onClick={() => handleMergeNextWeek(selectedWeekIndex)}
              disabled={selectedWeekIndex >= weeksList.length - 1}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-900 border border-white/10 rounded-full hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <Combine className="w-3.5 h-3.5 text-blue-400" />
              Merge with Next Week
            </button>
          </div>
        </div>

        {/* Center/Right Main Editor Workspace */}
        <div className={`flex-1 bg-[#0b0f19] p-4 sm:p-6 overflow-y-auto ${
          mobileTab === 'editor' ? 'block' : 'hidden md:block'
        }`}>
          {viewMode === 'editor' ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Week Title / Topic Header */}
              <div className="glass-panel bg-[#0f172a] p-6 rounded-3xl border border-white/10 shadow-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                  <span>Week {currentWeek?.week_number} Editor</span>
                </div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Lesson Topic Title *
                </label>
                <input
                  type="text"
                  value={currentWeek?.topic || ''}
                  onChange={(e) => updateCurrentWeek({ topic: e.target.value })}
                  placeholder="e.g. Cell Structure & Functions"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-full font-bold text-white text-sm sm:text-base focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                />
              </div>

              {/* Content Sections Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm font-display">
                    Lesson Content & Table Sections ({currentWeek?.content_json?.length || 0})
                  </h3>
                  <button
                    onClick={handleAddSection}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Section
                  </button>
                </div>

                {currentWeek?.content_json?.map((section, sIndex) => (
                  <div
                    key={sIndex}
                    className="glass-panel bg-[#0f172a] p-5 rounded-3xl border border-white/10 space-y-3 relative group shadow-xl"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        Section #{sIndex + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInsertTableSnippet(sIndex)}
                          className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold transition-colors"
                        >
                          <TableIcon className="w-3.5 h-3.5 text-amber-400" />
                          Insert Word Table
                        </button>
                        <button
                          onClick={() => handleDeleteSection(sIndex)}
                          className="text-slate-400 hover:text-rose-400 p-1 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Subheading
                      </label>
                      <input
                        type="text"
                        value={section.subheading}
                        onChange={(e) =>
                          handleUpdateSection(sIndex, { subheading: e.target.value })
                        }
                        placeholder="e.g. Introduction to Organelles"
                        className="w-full px-3.5 py-2 bg-slate-900 border border-white/10 rounded-full text-xs font-semibold text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Paragraph Prose & Markdown Tables
                      </label>
                      <textarea
                        rows={5}
                        value={section.paragraphs.join('\n\n')}
                        onChange={(e) =>
                          handleUpdateSection(sIndex, {
                            paragraphs: e.target.value.split('\n\n'),
                          })
                        }
                        placeholder="Enter textbook lesson prose. Separate paragraphs with double line breaks. Markdown tables (| col1 | col2 |) will render as native Word tables in exported DOCX."
                        className="w-full p-3 bg-slate-900 border border-white/10 rounded-2xl text-xs font-mono text-slate-100 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none resize-y"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Formatted Print Preview Screen */
            <div className="max-w-3xl mx-auto glass-panel bg-[#0f172a] text-slate-100 p-4 sm:p-8 md:p-10 rounded-3xl shadow-2xl min-h-[80vh] border border-white/10 space-y-6">
              <div className="border-b-2 border-indigo-500 pb-3 flex justify-between items-end">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    WEEK {currentWeek?.week_number}
                  </span>
                  <h1 className="text-2xl font-bold text-white font-display">{currentWeek?.topic}</h1>
                </div>
                <span className="text-xs text-slate-400 font-medium">{book.subject}</span>
              </div>

              {currentWeek?.content_json?.map((sec, i) => (
                <div key={i} className="space-y-3">
                  <h3 className="text-base font-bold text-slate-200 border-l-4 border-indigo-500 pl-2">
                    {sec.subheading}
                  </h3>

                  {sec.paragraphs.map((p, pIdx) => {
                    const blocks = parseParagraphBlocks(p);
                    return (
                      <React.Fragment key={pIdx}>
                        {blocks.map((block, bIdx) => {
                          if (block.type === 'table') {
                            return (
                              <div key={bIdx} className="my-4 overflow-x-auto rounded border border-indigo-500/30 bg-slate-900/90 shadow-sm">
                                <table className="w-full text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-indigo-950/80 border-b border-indigo-500/30">
                                      {block.data.headers.map((h, hIdx) => (
                                        <th
                                          key={hIdx}
                                          className="border-r border-indigo-500/20 last:border-r-0 px-3 py-2 text-left font-semibold text-indigo-100"
                                        >
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {block.data.rows.map((row, rIdx) => (
                                      <tr
                                        key={rIdx}
                                        className={`border-b border-white/5 last:border-b-0 ${
                                          rIdx % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-950/80'
                                        }`}
                                      >
                                        {row.map((cell, cIdx) => (
                                          <td
                                            key={cIdx}
                                            className="border-r border-white/5 last:border-r-0 px-3 py-2 text-slate-300"
                                          >
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          }

                          return (
                            <p key={bIdx} className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                              {block.content}
                            </p>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}

                  {sec.table && !sec.paragraphs?.some((p) => parseMarkdownTable(p) !== null) && (
                    <div className="my-4 overflow-x-auto">
                      <table className="w-full text-xs border-collapse border border-white/10">
                        <thead>
                          <tr className="bg-slate-900">
                            {sec.table.headers.map((h, hIdx) => (
                              <th
                                key={hIdx}
                                className="border border-white/10 px-3 py-2 text-left font-bold text-white"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sec.table.rows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className={rIdx % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-950/80'}
                            >
                              {row.map((cell, cIdx) => (
                                <td
                                  key={cIdx}
                                  className="border border-white/10 px-3 py-2 text-slate-300"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
