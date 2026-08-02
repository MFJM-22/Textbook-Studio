import React from 'react';
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
} from 'lucide-react';
import { Book, BookStatus } from '../types';

interface BookCardProps {
  book: Book;
  onReview: (book: Book) => void;
  onViewPages: (book: Book) => void;
  onGlossary: (book: Book) => void;
  onExportDocx: (book: Book) => void;
  onPrintPreview: (book: Book) => void;
  onDelete: (bookId: string) => void;
}

const statusBadges: Record<
  BookStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  uploading: {
    label: 'Uploading Notes',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  ocr_processing: {
    label: 'OCR Processing',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <Sparkles className="w-3.5 h-3.5 animate-pulse" />,
  },
  awaiting_review: {
    label: 'Awaiting Human Review',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: <Edit className="w-3.5 h-3.5" />,
  },
  reviewed: {
    label: 'Reviewed & Approved',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  generated: {
    label: 'Publish Ready',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: <BookMarked className="w-3.5 h-3.5" />,
  },
};

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onReview,
  onViewPages,
  onGlossary,
  onExportDocx,
  onPrintPreview,
  onDelete,
}) => {
  const badge = statusBadges[book.status] || statusBadges.uploading;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {book.subject} • {book.class_level}
              </span>
              <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                {book.title}
              </h3>
            </div>
          </div>

          <button
            onClick={() => onDelete(book.id)}
            title="Delete Book"
            className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
          >
            {badge.icon}
            {badge.label}
          </span>
          <span className="text-xs text-slate-500">
            Term: <strong className="text-slate-700">{book.term}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
          <div>
            <span className="text-slate-400 block">Scanned Pages:</span>
            <span className="font-semibold text-slate-800">{book.pages_count || 0} pages</span>
          </div>
          <div>
            <span className="text-slate-400 block">Created:</span>
            <span className="font-semibold text-slate-800">
              {new Date(book.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onViewPages(book)}
            title="View Scanned Pages & OCR Text"
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-xs font-medium flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">OCR Pages</span>
          </button>

          <button
            onClick={() => onGlossary(book)}
            title="Manage Glossary Terms"
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-xs font-medium flex items-center gap-1"
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Glossary</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {book.status === 'awaiting_review' || book.status === 'ocr_processing' ? (
            <button
              onClick={() => onReview(book)}
              id={`review-book-${book.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-xs transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Review Structure
            </button>
          ) : (
            <>
              <button
                onClick={() => onReview(book)}
                title="Edit Structured Content"
                className="p-1.5 text-slate-700 hover:text-purple-600 hover:bg-white rounded-lg border border-slate-200 transition-colors text-xs font-medium"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onPrintPreview(book)}
                title="Print / PDF Preview"
                className="p-1.5 text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg border border-slate-200 transition-colors text-xs font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onExportDocx(book)}
                id={`export-docx-${book.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                Word (.docx)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
