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
  Grid,
  Code,
  PlusCircle,
  AlertCircle,
  X,
  Upload,
  Check,
  CheckSquare,
  Square,
  Keyboard,
  Command,
} from 'lucide-react';
import { Book, Week, ContentSection } from '../types';
import {
  parseMarkdownTable,
  parseParagraphBlocks,
  normalizeContentSections,
  MarkdownTableData,
  ParagraphBlock,
} from '../lib/docGenerator';
import { FormattedText } from '../lib/formatUtils';
import { UploadWeekNotesModal } from './UploadWeekNotesModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export interface DetectedTableInfo {
  index: number;
  tableData: MarkdownTableData;
  isComplex: boolean;
  totalCells: number;
  rowCount: number;
  colCount: number;
}

export function detectMarkdownTables(paragraphs: string[]): DetectedTableInfo[] {
  if (!paragraphs || !Array.isArray(paragraphs)) return [];
  const fullText = paragraphs.join('\n\n');
  const blocks = parseParagraphBlocks(fullText);
  const detected: DetectedTableInfo[] = [];

  blocks.forEach((block, idx) => {
    if (block.type === 'table') {
      const colCount = block.data.headers.length;
      const rowCount = block.data.rows.length;
      const totalCells = colCount * rowCount;
      const isComplex = colCount >= 3 || rowCount >= 3 || totalCells >= 8;

      detected.push({
        index: idx,
        tableData: block.data,
        isComplex,
        totalCells,
        rowCount,
        colCount,
      });
    }
  });

  return detected;
}

export function serializeBlocksToParagraphs(blocks: ParagraphBlock[]): string[] {
  const result: string[] = [];
  for (const block of blocks) {
    if (block.type === 'text') {
      if (block.content.trim()) {
        result.push(block.content);
      }
    } else if (block.type === 'table') {
      const { headers, rows } = block.data;
      const formattedHeaders = headers.map((h) => (h || '').replace(/\|/g, '\\|').trim() || ' ');
      const headerLine = `| ${formattedHeaders.join(' | ')} |`;
      const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
      const rowLines = rows.map((row) => {
        const formattedCells = row.map((c) => (c || '').replace(/\|/g, '\\|').trim() || ' ');
        return `| ${formattedCells.join(' | ')} |`;
      });
      result.push([headerLine, separatorLine, ...rowLines].join('\n'));
    }
  }
  return result.length > 0 ? result : [''];
}

interface VisualTableGridEditorProps {
  paragraphs: string[];
  onChangeParagraphs: (newParas: string[]) => void;
}

export const VisualTableGridEditor: React.FC<VisualTableGridEditorProps> = ({
  paragraphs,
  onChangeParagraphs,
}) => {
  const fullText = (paragraphs || []).join('\n\n');
  const blocks = parseParagraphBlocks(fullText);

  const updateBlocks = (newBlocks: ParagraphBlock[]) => {
    onChangeParagraphs(serializeBlocksToParagraphs(newBlocks));
  };

  const handleTextChange = (index: number, newText: string) => {
    const updated = [...blocks];
    updated[index] = { type: 'text', content: newText };
    updateBlocks(updated);
  };

  const handleTableCellChange = (
    blockIdx: number,
    rowIndex: number | 'header',
    colIndex: number,
    val: string
  ) => {
    const updated = [...blocks];
    const target = updated[blockIdx];
    if (target && target.type === 'table') {
      const headers = [...target.data.headers];
      const rows = target.data.rows.map((r) => [...r]);

      if (rowIndex === 'header') {
        headers[colIndex] = val;
      } else {
        while (rows.length <= rowIndex) {
          rows.push(Array(headers.length).fill(''));
        }
        while (rows[rowIndex].length < headers.length) {
          rows[rowIndex].push('');
        }
        rows[rowIndex][colIndex] = val;
      }

      updated[blockIdx] = {
        type: 'table',
        data: { headers, rows },
      };
      updateBlocks(updated);
    }
  };

  const handleAddRow = (blockIdx: number) => {
    const updated = [...blocks];
    const target = updated[blockIdx];
    if (target && target.type === 'table') {
      const colCount = Math.max(1, target.data.headers.length);
      const newRow = Array(colCount).fill('');
      updated[blockIdx] = {
        type: 'table',
        data: {
          headers: [...target.data.headers],
          rows: [...target.data.rows, newRow],
        },
      };
      updateBlocks(updated);
    }
  };

  const handleDeleteRow = (blockIdx: number, rowIdx: number) => {
    const updated = [...blocks];
    const target = updated[blockIdx];
    if (target && target.type === 'table') {
      const newRows = target.data.rows.filter((_, i) => i !== rowIdx);
      updated[blockIdx] = {
        type: 'table',
        data: {
          headers: [...target.data.headers],
          rows: newRows,
        },
      };
      updateBlocks(updated);
    }
  };

  const handleAddColumn = (blockIdx: number) => {
    const updated = [...blocks];
    const target = updated[blockIdx];
    if (target && target.type === 'table') {
      const colCount = target.data.headers.length;
      const newHeader = `Header ${colCount + 1}`;
      const newHeaders = [...target.data.headers, newHeader];
      let newRows = target.data.rows.map((row) => {
        const paddedRow = [...row];
        while (paddedRow.length < target.data.headers.length) {
          paddedRow.push('');
        }
        return [...paddedRow, ''];
      });

      if (newRows.length === 0) {
        newRows = [Array(newHeaders.length).fill('')];
      }

      updated[blockIdx] = {
        type: 'table',
        data: { headers: newHeaders, rows: newRows },
      };
      updateBlocks(updated);
    }
  };

  const handleDeleteColumn = (blockIdx: number, colIdx: number) => {
    const updated = [...blocks];
    const target = updated[blockIdx];
    if (target && target.type === 'table') {
      if (target.data.headers.length <= 1) return;
      const newHeaders = target.data.headers.filter((_, i) => i !== colIdx);
      const newRows = target.data.rows.map((row) => row.filter((_, i) => i !== colIdx));

      updated[blockIdx] = {
        type: 'table',
        data: { headers: newHeaders, rows: newRows },
      };
      updateBlocks(updated);
    }
  };

  const handleDeleteTableBlock = (blockIdx: number) => {
    const updated = blocks.filter((_, i) => i !== blockIdx);
    updateBlocks(updated);
  };

  const handleAddNewTable = () => {
    const newTableBlock: ParagraphBlock = {
      type: 'table',
      data: {
        headers: ['Column 1', 'Column 2', 'Column 3'],
        rows: [
          ['Value 1', 'Value 2', 'Value 3'],
          ['Value 4', 'Value 5', 'Value 6'],
        ],
      },
    };
    updateBlocks([...blocks, newTableBlock]);
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, bIdx) => {
        if (block.type === 'text') {
          return (
            <div key={bIdx} className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-400">
                Lesson Prose Paragraph #{bIdx + 1}
              </label>
              <textarea
                rows={3}
                value={block.content}
                onChange={(e) => handleTextChange(bIdx, e.target.value)}
                placeholder="Enter lesson text or notes..."
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-sans text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none resize-y"
              />
            </div>
          );
        }

        const { headers, rows } = block.data;
        const colCount = headers.length;
        const rowCount = rows.length;
        const isComplex = colCount >= 3 || rowCount >= 3 || colCount * rowCount >= 8;

        return (
          <div
            key={bIdx}
            className="rounded-2xl border border-indigo-500/30 bg-slate-950/80 p-3.5 space-y-3 shadow-lg"
          >
            {/* Table Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-xs font-bold">
                  <TableIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Visual Table Editor
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {colCount} cols × {rowCount} rows
                </span>
                {isComplex && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    Complex Data Structure
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddColumn(bIdx)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  title="Add new column to table"
                >
                  <Plus className="w-3 h-3 text-indigo-400" />
                  Add Column
                </button>
                <button
                  type="button"
                  onClick={() => handleAddRow(bIdx)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  title="Add new row to table"
                >
                  <Plus className="w-3 h-3 text-indigo-400" />
                  Add Row
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTableBlock(bIdx)}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                  title="Delete table block"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Editable Table Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-indigo-950/60">
                    <th className="w-8 px-2 py-1.5 border border-indigo-500/20 text-slate-500 text-[10px] text-center">
                      #
                    </th>
                    {headers.map((h, colIdx) => (
                      <th
                        key={colIdx}
                        className="border border-indigo-500/20 px-2 py-1.5 text-left font-semibold text-indigo-200 min-w-[120px]"
                      >
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={h}
                            onChange={(e) =>
                              handleTableCellChange(bIdx, 'header', colIdx, e.target.value)
                            }
                            placeholder={`Header ${colIdx + 1}`}
                            className="w-full px-2 py-1 bg-slate-900 border border-indigo-500/40 rounded text-xs font-bold text-white focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                          />
                          {headers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(bIdx, colIdx)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                              title="Delete this column"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="w-8 border border-indigo-500/20"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => {
                    const rowCells = [...row];
                    while (rowCells.length < headers.length) {
                      rowCells.push('');
                    }
                    return (
                      <tr
                        key={rowIdx}
                        className={rowIdx % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-950/60'}
                      >
                        <td className="border border-white/5 px-2 py-1 text-center font-mono text-[10px] text-slate-500">
                          {rowIdx + 1}
                        </td>
                        {rowCells.slice(0, headers.length).map((cellVal, colIdx) => (
                          <td key={colIdx} className="border border-white/5 p-1 min-w-[120px]">
                            <input
                              type="text"
                              value={cellVal}
                              onChange={(e) =>
                                handleTableCellChange(bIdx, rowIdx, colIdx, e.target.value)
                              }
                              placeholder="Cell content..."
                              className="w-full px-2 py-1 bg-slate-900/90 border border-white/10 rounded text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none"
                            />
                          </td>
                        ))}
                        <td className="border border-white/5 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(bIdx, rowIdx)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                            title="Delete row"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Add Row Bar */}
            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={() => handleAddRow(bIdx)}
                className="flex items-center gap-1 px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                Add Row
              </button>
              <span className="text-[10px] text-slate-400">
                Grid changes auto-sync to Markdown table syntax for Word (.docx) export
              </span>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={handleAddNewTable}
        className="w-full py-2 px-3 border border-dashed border-indigo-500/40 rounded-xl bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <PlusCircle className="w-4 h-4 text-indigo-400" />
        Add Visual Table Grid Block
      </button>
    </div>
  );
};

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
  const [sectionEditorModes, setSectionEditorModes] = useState<Record<number, 'code' | 'visual'>>({});
  const [isUploadNotesModalOpen, setIsUploadNotesModalOpen] = useState<boolean>(false);
  const [selectedWeekIds, setSelectedWeekIds] = useState<string[]>([]);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    itemName?: string;
    message?: string;
    onConfirm: () => void;
  } | null>(null);

  // Global Keyboard Shortcuts Listener (Ctrl+S, Ctrl+P, Ctrl+E, Ctrl+K, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        setShortcutToast('Shortcut Activated: Draft Saved (Ctrl + S)');
        setTimeout(() => setShortcutToast(null), 2500);
        return;
      }

      if (isMod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (viewMode === 'preview') {
          window.print();
        } else {
          handleApprove();
        }
        setShortcutToast('Shortcut Activated: Print & Export (Ctrl + P)');
        setTimeout(() => setShortcutToast(null), 2500);
        return;
      }

      if (isMod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'editor' ? 'preview' : 'editor'));
        setShortcutToast('Shortcut Activated: View Mode Toggled (Ctrl + E)');
        setTimeout(() => setShortcutToast(null), 2500);
        return;
      }

      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setIsShortcutsModalOpen(false);
        setIsUploadNotesModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [weeksList, viewMode]);

  // Checkbox Selection & Multi-Delete Handlers
  const toggleSelectWeek = (weekId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedWeekIds((prev) =>
      prev.includes(weekId) ? prev.filter((id) => id !== weekId) : [...prev, weekId]
    );
  };

  const handleSelectAllWeeks = () => {
    if (selectedWeekIds.length === weeksList.length) {
      setSelectedWeekIds([]);
    } else {
      setSelectedWeekIds(weeksList.map((w) => w.id));
    }
  };

  const handleDeleteSelectedWeeks = () => {
    if (selectedWeekIds.length === 0) return;

    if (selectedWeekIds.length >= weeksList.length) {
      setShortcutToast('A textbook curriculum must contain at least one week.');
      setTimeout(() => setShortcutToast(null), 3000);
      return;
    }

    setDeleteModalConfig({
      isOpen: true,
      title: 'Delete Selected Weeks',
      itemName: `${selectedWeekIds.length} week(s) selected`,
      message: `Are you sure you want to delete these ${selectedWeekIds.length} selected week(s)? The remaining curriculum will be re-sequenced automatically.`,
      onConfirm: () => {
        const updated = weeksList.filter((w) => !selectedWeekIds.includes(w.id));
        const renumbered = updated.map((w, i) => ({ ...w, week_number: i + 1 }));
        setWeeksList(renumbered);
        setSelectedWeekIds([]);
        setSelectedWeekIndex(0);
        setDeleteModalConfig(null);
      },
    });
  };

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
    setIsUploadNotesModalOpen(true);
  };

  const handleAddBlankWeek = () => {
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

  const handleWeekCreated = (newWeek: Week) => {
    setWeeksList([...weeksList, newWeek]);
    setSelectedWeekIndex(weeksList.length);
  };

  const handleDeleteWeek = (index: number) => {
    if (weeksList.length <= 1) {
      setShortcutToast('A textbook curriculum must contain at least one week.');
      setTimeout(() => setShortcutToast(null), 3000);
      return;
    }
    const targetWeek = weeksList[index];
    setDeleteModalConfig({
      isOpen: true,
      title: `Delete Week ${targetWeek.week_number}`,
      itemName: targetWeek.topic,
      message: `Are you sure you want to delete Week ${targetWeek.week_number}? The remaining weeks will be automatically re-sequenced.`,
      onConfirm: () => {
        const updated = weeksList.filter((_, i) => i !== index);
        const renumbered = updated.map((w, i) => ({ ...w, week_number: i + 1 }));
        setWeeksList(renumbered);
        setSelectedWeekIndex(Math.max(0, index - 1));
        setDeleteModalConfig(null);
      },
    });
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
      setShortcutToast('Week needs at least 2 content sections to split into separate weeks.');
      setTimeout(() => setShortcutToast(null), 3000);
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
    if (currentWeek.content_json.length <= 1) {
      setShortcutToast('A week must contain at least one lesson section.');
      setTimeout(() => setShortcutToast(null), 3000);
      return;
    }
    const newContent = currentWeek.content_json.filter((_, i) => i !== sIndex);
    updateCurrentWeek({ content_json: newContent });
    setSectionEditorModes((prev) => {
      const next: Record<number, 'code' | 'visual'> = {};
      Object.keys(prev).forEach((keyStr) => {
        const k = Number(keyStr);
        if (k < sIndex) {
          next[k] = prev[k];
        } else if (k > sIndex) {
          next[k - 1] = prev[k];
        }
      });
      return next;
    });
  };

  const handleInsertTableSnippet = (sIndex: number) => {
    if (!currentWeek) return;
    const section = currentWeek.content_json[sIndex];
    if (!section) return;
    const tableSnippet = `\n| Item | Description | Value |\n| --- | --- | --- |\n| Example A | First sample entry | 100 |\n| Example B | Second sample entry | 200 |\n`;
    const updatedParas = [...(section.paragraphs || []), tableSnippet];
    handleUpdateSection(sIndex, { paragraphs: updatedParas });
    setSectionEditorModes((prev) => ({ ...prev, [sIndex]: 'visual' }));
  };

  const [saveToast, setSaveToast] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveToast(null);
    try {
      await onSaveWeeks(weeksList);
      setSaveToast('Saved draft changes successfully!');
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err) {
      console.error('Error saving weeks:', err);
      setSaveToast('Failed to save changes. Please try again.');
      setTimeout(() => setSaveToast(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    setSaveToast(null);
    try {
      await onSaveWeeks(weeksList);
      setSaveToast('Textbook structure approved and saved!');
      await onApproveAndContinue();
    } catch (err) {
      console.error('Error approving structure:', err);
      setSaveToast('Failed to approve structure.');
      setTimeout(() => setSaveToast(null), 4000);
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
                onClick={() => setIsShortcutsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-full transition-colors min-h-[36px] cursor-pointer"
                title="Keyboard Shortcuts (Ctrl+K)"
              >
                <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Shortcuts</span>
              </button>

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
                Curriculum ({weeksList.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSelectAllWeeks}
                  title={selectedWeekIds.length === weeksList.length ? "Deselect All" : "Select All"}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-indigo-300 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {selectedWeekIds.length === weeksList.length && weeksList.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  <span>{selectedWeekIds.length === weeksList.length && weeksList.length > 0 ? 'All' : 'Select'}</span>
                </button>
                <button
                  onClick={handleAddWeek}
                  title="Add Week"
                  className="p-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-full transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {selectedWeekIds.length > 0 && (
              <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-150">
                <span className="text-xs font-semibold text-rose-300">
                  {selectedWeekIds.length} week{selectedWeekIds.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDeleteSelectedWeeks}
                    className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWeekIds([])}
                    className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                    title="Clear Selection"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {weeksList.map((w, index) => {
                const isChecked = selectedWeekIds.includes(w.id);
                const isSelected = selectedWeekIndex === index;

                return (
                  <div
                    key={w.id}
                    onClick={() => {
                      setSelectedWeekIndex(index);
                      setMobileTab('editor');
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${
                      isChecked
                        ? 'bg-indigo-950/60 border-indigo-500/60 ring-1 ring-indigo-500/30 text-white'
                        : isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/50 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <button
                        type="button"
                        onClick={(e) => toggleSelectWeek(w.id, e)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600 text-white border border-indigo-400 shadow-xs'
                            : 'bg-slate-950 border border-white/20 text-transparent hover:border-indigo-400/60'
                        }`}
                        title={isChecked ? 'Deselect week' : 'Select week'}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

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

                    <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
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
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
            <button
              onClick={() => setIsUploadNotesModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-full transition-colors shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-200" />
              Upload Notes for New Week
            </button>
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

                {currentWeek?.content_json?.map((section, sIndex) => {
                  const detected = detectMarkdownTables(section.paragraphs);
                  const hasComplexTable = detected.some((t) => t.isComplex);
                  const activeMode = sectionEditorModes[sIndex] || (detected.length > 0 ? 'visual' : 'code');

                  const toggleMode = (mode: 'code' | 'visual') => {
                    setSectionEditorModes((prev) => ({ ...prev, [sIndex]: mode }));
                  };

                  return (
                    <div
                      key={sIndex}
                      className="glass-panel bg-[#0f172a] p-5 rounded-3xl border border-white/10 space-y-3 relative group shadow-xl"
                    >
                      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase">
                            Section #{sIndex + 1}
                          </span>

                          {detected.length > 0 && (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[11px] font-semibold">
                              <TableIcon className="w-3 h-3 text-indigo-400" />
                              {detected.length} Table{detected.length > 1 ? 's' : ''}
                            </span>
                          )}

                          {hasComplexTable && (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[11px] font-bold">
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                              Complex Data
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Mode Switcher */}
                          <div className="flex items-center bg-slate-900 border border-white/10 rounded-full p-0.5">
                            <button
                              type="button"
                              onClick={() => toggleMode('visual')}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                activeMode === 'visual'
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Grid className="w-3 h-3" />
                              Visual Grid
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleMode('code')}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                activeMode === 'code'
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Code className="w-3 h-3" />
                              Raw Code
                            </button>
                          </div>

                          <button
                            onClick={() => handleInsertTableSnippet(sIndex)}
                            className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <TableIcon className="w-3.5 h-3.5 text-amber-400" />
                            Insert Table
                          </button>
                          <button
                            onClick={() => handleDeleteSection(sIndex)}
                            className="text-slate-400 hover:text-rose-400 p-1 rounded-full transition-colors cursor-pointer"
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
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-300">
                            Paragraph Prose & Markdown Tables
                          </label>
                          {detected.length > 0 && activeMode === 'code' && (
                            <button
                              type="button"
                              onClick={() => toggleMode('visual')}
                              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <AlertCircle className="w-3 h-3" />
                              {hasComplexTable ? 'Complex table detected' : 'Table detected'} — Edit in Visual Grid
                            </button>
                          )}
                        </div>

                        {activeMode === 'visual' ? (
                          <VisualTableGridEditor
                            paragraphs={section.paragraphs}
                            onChangeParagraphs={(newParas) =>
                              handleUpdateSection(sIndex, { paragraphs: newParas })
                            }
                          />
                        ) : (
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
                        )}
                      </div>
                    </div>
                  );
                })}
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
                                <table className="markdown-table w-full text-xs border-collapse">
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
                            <div key={bIdx} className="text-xs text-slate-300 leading-relaxed my-1">
                              <FormattedText text={block.content} />
                            </div>
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

      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-2xl border border-emerald-400/30 font-semibold text-xs animate-bounce">
          <CheckCircle className="w-4.5 h-4.5 text-white shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {shortcutToast && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-indigo-600 text-white rounded-2xl shadow-2xl border border-indigo-400/30 font-semibold text-xs animate-bounce">
          <Command className="w-4 h-4 text-indigo-200 shrink-0" />
          <span>{shortcutToast}</span>
        </div>
      )}

      {isShortcutsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
                  <p className="text-xs text-slate-400">Speed up your textbook editing workflow</p>
                </div>
              </div>
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'Ctrl + S', desc: 'Save draft changes' },
                { key: 'Ctrl + P', desc: 'Print preview / approve & continue' },
                { key: 'Ctrl + E', desc: 'Toggle between Edit and Preview modes' },
                { key: 'Ctrl + K', desc: 'Open / close this keyboard shortcuts guide' },
                { key: 'Esc', desc: 'Close open dialogs or modals' },
              ].map((sc, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                  <span className="text-slate-300 font-medium">{sc.desc}</span>
                  <kbd className="px-2.5 py-1 bg-slate-900 border border-white/10 rounded-lg text-indigo-400 font-mono font-bold shadow-xs">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center text-xs text-slate-500">
              Press <kbd className="px-1.5 py-0.5 bg-slate-900 rounded border border-white/10 font-mono">Esc</kbd> anytime to close
            </div>
          </div>
        </div>
      )}

      <UploadWeekNotesModal
        isOpen={isUploadNotesModalOpen}
        nextWeekNumber={weeksList.length + 1}
        bookId={book.id}
        onClose={() => setIsUploadNotesModalOpen(false)}
        onWeekCreated={handleWeekCreated}
        onAddBlankWeek={handleAddBlankWeek}
      />

      {/* In-Editor Delete Confirmation Modal */}
      {deleteModalConfig && (
        <DeleteConfirmModal
          isOpen={deleteModalConfig.isOpen}
          title={deleteModalConfig.title}
          itemName={deleteModalConfig.itemName}
          message={deleteModalConfig.message}
          onConfirm={deleteModalConfig.onConfirm}
          onCancel={() => setDeleteModalConfig(null)}
        />
      )}
    </div>
  );
};
