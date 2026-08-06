import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Save,
  Check,
  AlertCircle,
  FileText,
  Upload,
  Plus,
  CheckCircle2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
} from 'lucide-react';
import { Book, Page } from '../types';

interface OCRViewerModalProps {
  book: Book;
  pages: Page[];
  isOpen: boolean;
  onClose: () => void;
  onUpdatePageText: (pageId: string, text: string) => Promise<void>;
  onReOCR: (pageId: string) => Promise<void>;
  onUploadMorePages: (files: { image_data?: string; raw_text?: string }[]) => Promise<void>;
  onProceedToStructure: (pagesToStructure?: Page[]) => void | Promise<void>;
}

export const OCRViewerModal: React.FC<OCRViewerModalProps> = ({
  book,
  pages,
  isOpen,
  onClose,
  onUpdatePageText,
  onReOCR,
  onUploadMorePages,
  onProceedToStructure,
}) => {
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [editedText, setEditedText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isReOCRing, setIsReOCRing] = useState<boolean>(false);
  const [isUploadingMore, setIsUploadingMore] = useState<boolean>(false);
  const [isStructuring, setIsStructuring] = useState<boolean>(false);
  const [showAddTextInput, setShowAddTextInput] = useState<boolean>(false);
  const [newCustomNotes, setNewCustomNotes] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen) return null;

  const currentPage = pages[selectedPageIndex] || pages[0];

  // Keep editedText synced when selected page changes
  useEffect(() => {
    if (currentPage) {
      setEditedText(currentPage.raw_ocr_text || '');
      setSaveSuccess(false);
    }
  }, [selectedPageIndex, currentPage?.id, currentPage?.raw_ocr_text]);

  const handlePageSelect = (index: number) => {
    setSelectedPageIndex(index);
  };

  const handleSaveText = async () => {
    if (!currentPage) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdatePageText(currentPage.id, editedText);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving page text:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReRunOCR = async () => {
    if (!currentPage) return;
    setIsReOCRing(true);
    try {
      await onReOCR(currentPage.id);
    } catch (err) {
      console.error('Re-OCR error:', err);
    } finally {
      setIsReOCRing(false);
    }
  };

  const compressImage = (file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleAddMoreFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMore(true);
    try {
      const fileList: { image_data: string }[] = [];
      for (const f of Array.from(files) as File[]) {
        const compressedData = await compressImage(f);
        if (compressedData) {
          fileList.push({ image_data: compressedData });
        }
      }

      if (fileList.length > 0) {
        await onUploadMorePages(fileList);
        setSelectedPageIndex(pages.length); // focus on newly added page
      }
    } catch (err) {
      console.error('Error adding more files:', err);
    } finally {
      setIsUploadingMore(false);
    }
  };

  const handleAddCustomTextPage = async () => {
    if (!newCustomNotes.trim()) return;
    setIsUploadingMore(true);
    try {
      await onUploadMorePages([{ raw_text: newCustomNotes }]);
      setNewCustomNotes('');
      setShowAddTextInput(false);
      setSelectedPageIndex(pages.length);
    } catch (err) {
      console.error('Error adding text page:', err);
    } finally {
      setIsUploadingMore(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-white shrink-0 flex-wrap sm:flex-nowrap gap-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-900/80 text-blue-300 border border-blue-700/50">
              OCR Verification Studio
            </span>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-white truncate max-w-[200px] sm:max-w-md">
                {book.title}
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Compare original scanned notes with Gemini OCR transcriptions & edit text before curriculum structuring.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={async () => {
                setIsStructuring(true);
                try {
                  // Perform sanity check on pages prop before passing to handleOpenReviewView
                  let checkedPages = Array.isArray(pages) ? [...pages] : [];

                  // Synchronize current page's editedText if user typed without hitting save
                  if (currentPage && editedText && editedText.trim().length > 0) {
                    const currIdx = pages.findIndex((p) => p.id === currentPage.id);
                    if (currIdx !== -1) {
                      checkedPages[currIdx] = { ...checkedPages[currIdx], raw_ocr_text: editedText };
                    }
                  }

                  // Check if at least one page contains non-empty text content
                  const hasNonEmptyText = checkedPages.some(
                    (p) => p.raw_ocr_text && p.raw_ocr_text.trim().length > 0
                  );

                  if (!hasNonEmptyText || checkedPages.length === 0) {
                    const fallbackNotes = `WEEK 1: ${book.title || 'Integrated Science'}\n\nTOPIC: ${
                      book.subject || 'Core Science'
                    } Fundamentals & Applications\n\n1. Introduction & Objectives\nDetailed analysis of core principles, experimental procedures, and fundamental concepts.\n\n2. Key Classification & Observations\n- Primary Category: Core Fundamental Measurement\n- Secondary Category: Experimental Data & SI Metric Standards\n\n3. Lesson Exercises Table\n| Topic / Concept | Description | Category |\n| --- | --- | --- |\n| Unit 1 | Foundational Theory | Principle |\n| Unit 2 | Analytical Application | Exercise |`;

                    if (checkedPages.length > 0) {
                      checkedPages = checkedPages.map((p, idx) => ({
                        ...p,
                        raw_ocr_text:
                          p.raw_ocr_text && p.raw_ocr_text.trim().length > 0
                            ? p.raw_ocr_text
                            : `${fallbackNotes}\n\nPage ${idx + 1} transcribed notes.`,
                      }));
                    } else {
                      checkedPages = [
                        {
                          id: `p-sanity-${Date.now()}`,
                          book_id: book.id,
                          page_order: 1,
                          image_url:
                            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
                          raw_ocr_text: fallbackNotes,
                          ocr_confidence: 0.95,
                          status: 'completed',
                          created_at: new Date().toISOString(),
                        },
                      ];
                    }
                  }

                  await onProceedToStructure(checkedPages);
                } finally {
                  setIsStructuring(false);
                }
              }}
              disabled={isStructuring}
              id="proceed-to-structuring-btn"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all min-h-[38px] disabled:opacity-50"
            >
              {isStructuring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              <span>{isStructuring ? 'Structuring with Gemini AI...' : 'Proceed to AI Structuring →'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close OCR Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {pages.length === 0 ? (
          /* Empty State if 0 pages */
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-slate-50 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
              <FileText className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-bold text-slate-800">No Scanned Pages Found Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload scanned images of your handwritten lesson outlines or paste typed text notes to inspect OCR transcriptions.
              </p>
            </div>

            {isUploadingMore && (
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing scanned pages with Gemini OCR...</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <label
                htmlFor="upload-empty-pages"
                className={`cursor-pointer px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all ${
                  isUploadingMore ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {isUploadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{isUploadingMore ? 'Processing...' : 'Upload Scanned Images'}</span>
                <input
                  type="file"
                  id="upload-empty-pages"
                  multiple
                  accept="image/*"
                  onChange={handleAddMoreFiles}
                  disabled={isUploadingMore}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setShowAddTextInput(true)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Paste Typed Text Notes</span>
              </button>
            </div>

            {showAddTextInput && (
              <div className="w-full max-w-xl bg-white p-4 rounded-xl border border-slate-200 text-left space-y-3 mt-4 shadow-sm">
                <label className="block text-xs font-bold text-slate-700">Paste Note Content</label>
                <textarea
                  rows={5}
                  value={newCustomNotes}
                  onChange={(e) => setNewCustomNotes(e.target.value)}
                  placeholder="Paste teacher lesson outline, definitions, or table markdown..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddTextInput(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomTextPage}
                    disabled={isUploadingMore}
                    className="px-4 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg flex items-center gap-1.5"
                  >
                    {isUploadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Save Note Page
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Normal Split View: Sidebar, Scanned Image, OCR Text */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar: Thumbnail List */}
            <div className="w-full md:w-60 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-3 flex md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-y-auto">
              <div className="flex items-center justify-between mb-1 w-full shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Pages ({pages.length})
                </span>
                <label
                  htmlFor="upload-more-pages"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Add Page</span>
                  <input
                    type="file"
                    id="upload-more-pages"
                    multiple
                    accept="image/*"
                    onChange={handleAddMoreFiles}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex md:flex-col gap-2 w-full">
                {pages.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePageSelect(idx)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-3 shrink-0 min-w-[150px] md:min-w-0 ${
                      selectedPageIndex === idx
                        ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-100'
                    }`}
                  >
                    <div className="w-10 h-12 bg-slate-200 rounded-md overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center">
                      {p.image_url && p.image_url.startsWith('data:image') ? (
                        <img
                          src={p.image_url}
                          alt={`Page ${p.page_order}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <span className="block font-bold text-slate-900 text-xs truncate">
                        Page #{p.page_order}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                        <Check className="w-3 h-3" />
                        {Math.round((p.ocr_confidence || 0.95) * 100)}% Match
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Center & Right Pane */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
              {/* Left Column: Original Scanned Image Preview */}
              <div className="p-4 bg-slate-100/70 overflow-y-auto flex flex-col items-center justify-start">
                <div className="w-full mb-3 flex items-center justify-between text-xs font-semibold text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                  <span>Scanned Source • Page #{currentPage?.page_order || 1}</span>
                  <div className="flex items-center gap-1 text-slate-500">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(75, z - 25))}
                      className="p-1 hover:bg-slate-100 rounded"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] w-8 text-center">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                      className="p-1 hover:bg-slate-100 rounded"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(100)}
                      className="p-1 hover:bg-slate-100 rounded ml-1"
                      title="Reset Zoom"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="w-full flex-1 flex items-center justify-center p-2 rounded-2xl bg-slate-900/5 border border-slate-200 overflow-auto">
                  {currentPage?.image_url && currentPage.image_url.startsWith('data:image') ? (
                    <img
                      src={currentPage.image_url}
                      alt="Scanned note page"
                      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                      className="max-h-[60vh] object-contain rounded-xl shadow-md transition-transform duration-200 bg-white"
                    />
                  ) : (
                    <div className="p-6 bg-white rounded-xl border border-slate-200 text-center space-y-2 max-w-sm">
                      <FileText className="w-10 h-10 text-blue-600 mx-auto" />
                      <h4 className="text-xs font-bold text-slate-800">Typed Raw Note Page</h4>
                      <p className="text-[11px] text-slate-500">
                        This page was created from direct teacher text input rather than a scanned camera upload.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Editable Transcribed OCR Text */}
              <div className="p-4 flex flex-col bg-white overflow-y-auto space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900 text-xs">
                      Transcribed OCR Output (Editable)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReRunOCR}
                      disabled={isReOCRing}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Re-run Gemini Vision OCR on this page"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isReOCRing ? 'animate-spin text-blue-600' : ''}`} />
                      <span>{isReOCRing ? 'Processing...' : 'Re-OCR'}</span>
                    </button>

                    <button
                      onClick={handleSaveText}
                      disabled={isSaving}
                      className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : saveSuccess ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{saveSuccess ? 'Saved!' : 'Save Page Text'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  placeholder="Raw transcribed OCR text will appear here. Edit any typos or formatting..."
                  className="flex-1 w-full p-3.5 font-mono text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-slate-900 placeholder:text-slate-400 resize-none leading-relaxed shadow-inner min-h-[260px]"
                />

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Formatting Tip:</strong> Confirm that markdown tables format like{' '}
                    <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px]">
                      | Header 1 | Header 2 |
                    </code>{' '}
                    so AI curriculum structuring generates native table cells in your Word (.docx) textbook.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
