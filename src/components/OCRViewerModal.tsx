import React, { useState } from 'react';
import { X, RefreshCw, Save, Check, AlertCircle, FileText, Upload } from 'lucide-react';
import { Book, Page } from '../types';

interface OCRViewerModalProps {
  book: Book;
  pages: Page[];
  isOpen: boolean;
  onClose: () => void;
  onUpdatePageText: (pageId: string, text: string) => Promise<void>;
  onReOCR: (pageId: string) => Promise<void>;
  onUploadMorePages: (files: { image_data?: string }[]) => Promise<void>;
  onProceedToStructure: () => void;
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
  const [isReOCRing, setIsReOCRing] = useState<boolean>(false);

  if (!isOpen || pages.length === 0) return null;

  const currentPage = pages[selectedPageIndex] || pages[0];

  const handlePageSelect = (index: number) => {
    setSelectedPageIndex(index);
    setEditedText(pages[index]?.raw_ocr_text || '');
  };

  const handleSaveText = async () => {
    setIsSaving(true);
    await onUpdatePageText(currentPage.id, editedText);
    setIsSaving(false);
  };

  const handleReRunOCR = async () => {
    setIsReOCRing(true);
    await onReOCR(currentPage.id);
    setIsReOCRing(false);
  };

  const handleAddMoreFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: { image_data: string }[] = [];
    for (const f of Array.from(files) as File[]) {
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = (ev) => {
          if (ev.target?.result) fileList.push({ image_data: ev.target!.result as string });
          resolve();
        };
        reader.readAsDataURL(f);
      });
    }

    if (fileList.length > 0) {
      await onUploadMorePages(fileList);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white shrink-0 flex-wrap sm:flex-nowrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-blue-900 text-blue-300 border border-blue-700/50 shrink-0">
                OCR Processing
              </span>
              <h2 className="font-bold text-sm sm:text-base truncate max-w-[200px] sm:max-w-xs">{book.title}</h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
              Inspect scanned page transcriptions before AI week-by-week curriculum structuring.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
            <button
              onClick={onProceedToStructure}
              id="proceed-to-structuring-btn"
              className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-md shadow-purple-600/20 transition-colors min-h-[38px]"
            >
              Run AI Structuring &rarr;
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg min-h-[38px] min-w-[38px] flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Page Thumbnails */}
          <div className="w-full md:w-56 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-3 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between mb-2 w-full shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pages ({pages.length})
              </span>
              <label
                htmlFor="upload-more-pages"
                className="cursor-pointer text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                Add
              </label>
              <input
                type="file"
                id="upload-more-pages"
                multiple
                accept="image/*"
                onChange={handleAddMoreFiles}
                className="hidden"
              />
            </div>

            <div className="flex md:flex-col gap-2 w-full overflow-x-auto md:overflow-visible">
              {pages.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => handlePageSelect(idx)}
                  className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 shrink-0 min-w-[140px] md:min-w-0 ${
                    selectedPageIndex === idx
                      ? 'border-blue-600 bg-white shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-100 hover:bg-white'
                  }`}
                >
                  <div className="w-9 h-11 bg-slate-200 rounded overflow-hidden shrink-0 border border-slate-300">
                    <img
                      src={p.image_url}
                      alt={`Page ${p.page_order}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <span className="block font-bold text-slate-800 text-xs truncate">
                      Page #{p.page_order}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                      <Check className="w-3 h-3" />
                      {Math.round((p.ocr_confidence || 0.95) * 100)}% Match
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Area: Split View Image vs OCR Text */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-200 overflow-hidden">
            {/* Scanned Image Preview */}
            <div className="p-4 bg-slate-900/5 overflow-y-auto flex flex-col items-center justify-start">
              <div className="w-full mb-2 flex justify-between items-center text-xs font-semibold text-slate-600">
                <span>Scanned Original Page #{currentPage.page_order}</span>
                <span className="text-slate-400">Gemini Vision Input</span>
              </div>
              <div className="max-w-full rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-white">
                <img
                  src={currentPage.image_url}
                  alt="Scanned original"
                  className="max-h-[60vh] object-contain mx-auto"
                />
              </div>
            </div>

            {/* OCR Extracted Text Editor */}
            <div className="p-4 flex flex-col bg-white overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800 text-xs">
                    Transcribed Note Text (Markdown Supported)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReRunOCR}
                    disabled={isReOCRing}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReOCRing ? 'animate-spin' : ''}`} />
                    Re-OCR
                  </button>

                  <button
                    onClick={handleSaveText}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-2xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Text
                  </button>
                </div>
              </div>

              <textarea
                value={editedText !== '' ? editedText : currentPage.raw_ocr_text || ''}
                onChange={(e) => setEditedText(e.target.value)}
                placeholder="Raw OCR output will appear here..."
                className="flex-1 w-full p-3 font-mono text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-slate-900 placeholder:text-slate-400 resize-none leading-relaxed"
              />

              <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                Check that markdown tables (`| col1 | col2 |`) and formulas are transcribed correctly before proceeding to structuring.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
