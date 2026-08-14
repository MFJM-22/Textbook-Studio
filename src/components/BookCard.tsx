import React, { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  FileDown,
  Printer,
  Sparkles,
  BookOpen,
  Trash2,
  Edit,
  BookMarked,
  Loader2,
  Download,
} from 'lucide-react';
import { Book, BookStatus } from '../types';

interface BookCardProps {
  book: Book;
  onReview: (book: Book) => void;
  onViewPages: (book: Book) => void;
  onExportDocx: (book: Book) => void;
  onDownloadPdf: (book: Book) => void;
  onPrintPreview: (book: Book) => void;
  onDelete: (book: Book) => void;
}

const statusBadges: Record<
  BookStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  uploading: {
    label: 'Uploading Notes',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  ocr_processing: {
    label: 'OCR Processing',
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/30',
    icon: <Sparkles className="w-3.5 h-3.5 animate-pulse" />,
  },
  awaiting_review: {
    label: 'Awaiting Human Review',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    icon: <Edit className="w-3.5 h-3.5" />,
  },
  reviewed: {
    label: 'Reviewed & Approved',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  generated: {
    label: 'Publish Ready',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    icon: <BookMarked className="w-3.5 h-3.5" />,
  },
};

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onReview,
  onViewPages,
  onExportDocx,
  onDownloadPdf,
  onPrintPreview,
  onDelete,
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const badge = statusBadges[book.status] || statusBadges.uploading;

  const handleDownloadPdfClick = async () => {
    setIsDownloadingPdf(true);
    try {
      await onDownloadPdf(book);
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl border border-white/10 transition-all flex flex-col justify-between overflow-hidden group">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-semibold uppercase font-mono tracking-wider text-slate-400 truncate block">
                {book.subject} • {book.class_level}
              </span>
              <h3 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-1 font-display group-hover:text-emerald-400 transition-colors">
                {book.title}
              </h3>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(book);
            }}
            id={`delete-book-${book.id}`}
            title={`Delete ${book.title}`}
            aria-label={`Delete ${book.title}`}
            className="text-slate-400 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/15 border border-transparent hover:border-red-500/30 transition-all shrink-0 cursor-pointer active:scale-95 group/del"
          >
            <Trash2 className="w-4 h-4 transition-transform group-hover/del:scale-110" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
          >
            {badge.icon}
            {badge.label}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Term: <strong className="text-white">{book.term}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-xl bg-black/30 border border-white/5 text-xs text-slate-300">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-mono">Scanned Pages</span>
            <span className="font-semibold text-white">{book.pages_count || 0} pages</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-mono">Created</span>
            <span className="font-semibold text-white truncate block">
              {new Date(book.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-white/[0.02] border-t border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewPages(book)}
            title="View Scanned Pages & OCR Text"
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all text-xs font-medium flex items-center gap-1.5 border border-white/5"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">OCR Pages</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {book.status === 'awaiting_review' || book.status === 'ocr_processing' ? (
            <button
              onClick={() => onReview(book)}
              id={`review-book-${book.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold btn-emerald whitespace-nowrap"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Review Structure</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => onReview(book)}
                title="Edit Structured Content"
                className="p-2 text-slate-300 hover:text-white btn-glass text-xs font-medium"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onPrintPreview(book)}
                title="Print / PDF Preview"
                className="p-2 text-slate-300 hover:text-white btn-glass text-xs font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleDownloadPdfClick}
                id={`download-pdf-${book.id}`}
                disabled={isDownloadingPdf}
                title="Download PDF Document"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl transition-all shadow-xs border border-rose-500/30 whitespace-nowrap disabled:opacity-50 cursor-pointer disabled:cursor-wait"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>PDF</span>
              </button>

              <button
                onClick={() => onExportDocx(book)}
                id={`export-docx-${book.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold btn-emerald whitespace-nowrap"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Word</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

