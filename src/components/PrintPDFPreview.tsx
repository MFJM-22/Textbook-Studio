import React, { useState } from 'react';
import { Printer, ArrowLeft, Download, FileText, Loader2, Palette, BookOpen, Sparkles, Layout, Check } from 'lucide-react';
import { Author, Book, Week, GlossaryTerm, ExportTheme } from '../types';
import { parseMarkdownTable, parseParagraphBlocks } from '../lib/docGenerator';
import { downloadBookPdfClient } from '../lib/pdfGenerator';
import { FormattedText, cleanPlainText } from '../lib/formatUtils';

interface PrintPDFPreviewProps {
  book: Book;
  author: Author;
  weeks: Week[];
  glossary?: GlossaryTerm[];
  onBack: () => void;
  onExportDocx: (theme: ExportTheme) => void;
}

const THEME_OPTIONS: {
  id: ExportTheme;
  label: string;
  tag: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    id: 'academic',
    label: 'Academic',
    tag: 'Classic Serif',
    description: 'Traditional textbook layout with serif typography, dark headers & formal borders.',
    icon: BookOpen,
  },
  {
    id: 'minimalist',
    label: 'Minimalist',
    tag: 'Scandinavian',
    description: 'Monochromatic slate design with sans-serif fonts, subtle dividers & airy spacing.',
    icon: Layout,
  },
  {
    id: 'creative',
    label: 'Creative',
    tag: 'Vibrant Primary',
    description: 'Engaging educational theme with rich indigo & emerald accents, rounded pill badges.',
    icon: Sparkles,
  },
  {
    id: 'modern',
    label: 'Modern STEM',
    tag: 'Technical Grid',
    description: 'Tech-focused sky blue & teal styling with monospaced metadata chips & crisp table grids.',
    icon: Palette,
  },
];

export const PrintPDFPreview: React.FC<PrintPDFPreviewProps> = ({
  book,
  author,
  weeks,
  glossary,
  onBack,
  onExportDocx,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<ExportTheme>('academic');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      downloadBookPdfClient(book, author, safeWeeks, glossary, selectedTheme);
    } catch (err) {
      console.error('Direct PDF generation error:', err);
      try {
        window.print();
      } catch (printErr) {
        console.error('Print dialog error:', printErr);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      handleDownloadPdf();
    }
  };

  const safeWeeks = weeks || [];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans print:bg-white print:text-black">
      {/* Non-printable Top Bar */}
      <div className="bg-[#0b0f19] border-b border-white/10 px-4 sm:px-6 py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sticky top-0 z-40 print:hidden text-slate-100 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors border border-white/10 shrink-0"
            title="Back to Editor"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-white font-display">Print & PDF Studio</h2>
            <p className="text-xs text-slate-400 truncate max-w-xs">{book.title}</p>
          </div>
        </div>

        {/* Theme Selector UI */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 overflow-x-auto self-center max-w-full">
          <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider hidden xl:inline shrink-0">
            Theme Style:
          </span>
          {THEME_OPTIONS.map((themeOpt) => {
            const Icon = themeOpt.icon;
            const isSelected = selectedTheme === themeOpt.id;
            return (
              <button
                key={themeOpt.id}
                onClick={() => setSelectedTheme(themeOpt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold border border-indigo-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title={themeOpt.description}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{themeOpt.label}</span>
                {isSelected && <Check className="w-3 h-3 text-indigo-200" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          <button
            onClick={() => onExportDocx(selectedTheme)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download Word
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            id="download-pdf-btn"
            className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-300 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer disabled:cursor-wait active:scale-95"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF (.pdf)'}
          </button>

          <button
            onClick={handlePrint}
            id="print-pdf-btn"
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Theme Info Sub-Banner */}
      <div className="bg-[#0f172a] border-b border-white/5 px-6 py-2 text-center text-xs text-slate-400 print:hidden flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>
          Active Template: <strong className="text-slate-200 font-semibold">{THEME_OPTIONS.find((t) => t.id === selectedTheme)?.label}</strong> — {THEME_OPTIONS.find((t) => t.id === selectedTheme)?.description}
        </span>
      </div>

      {/* Printable Textbook Pages Container */}
      <div
        id="printable-textbook-content"
        className={`max-w-4xl mx-auto my-8 print:my-0 p-8 sm:p-12 bg-white rounded-2xl shadow-2xl print:shadow-none border border-slate-200 print:border-none space-y-16 print:space-y-0 transition-all ${
          selectedTheme === 'academic' ? 'font-serif text-slate-900' : 'font-sans text-slate-900'
        }`}
      >
        {/* PAGE 1: COVER PAGE */}
        <div className="min-h-[85vh] flex flex-col justify-between items-center text-center py-16 border-b border-slate-200 print:border-none print:page-break-after-always">
          <div className="space-y-4 max-w-xl mx-auto my-auto">
            <span
              className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                selectedTheme === 'academic'
                  ? 'text-slate-900 bg-slate-100 border-slate-300'
                  : selectedTheme === 'minimalist'
                  ? 'text-zinc-800 bg-zinc-100 border-zinc-300 font-mono'
                  : selectedTheme === 'creative'
                  ? 'text-indigo-700 bg-indigo-50 border-indigo-200 font-bold'
                  : 'text-sky-800 bg-sky-50 border-sky-200 font-mono'
              }`}
            >
              {book.subject} • {book.class_level} • {book.term}
            </span>

            <h1
              className={`text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight ${
                selectedTheme === 'academic' ? 'font-serif' : 'font-sans'
              }`}
            >
              {book.title}
            </h1>

            <div
              className={`w-24 h-1.5 mx-auto my-6 ${
                selectedTheme === 'academic'
                  ? 'bg-slate-900'
                  : selectedTheme === 'minimalist'
                  ? 'bg-zinc-400 h-0.5'
                  : selectedTheme === 'creative'
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full'
                  : 'bg-sky-600'
              }`}
            ></div>

            <p className="text-sm text-slate-500 italic">Curriculum Textbook & Study Guide</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Authored By</p>
            <h3 className="text-lg font-bold text-slate-900">{author.name}</h3>
            <p className="text-xs text-slate-600">{author.credentials}</p>
          </div>
        </div>

        {/* PAGE 2: ABOUT THE AUTHOR */}
        <div className="min-h-[70vh] py-12 border-b border-slate-200 print:border-none print:page-break-after-always space-y-6">
          <h2
            className={`text-2xl font-bold text-slate-900 pb-2 border-b-2 ${
              selectedTheme === 'academic'
                ? 'border-slate-900 font-serif'
                : selectedTheme === 'minimalist'
                ? 'border-zinc-300'
                : selectedTheme === 'creative'
                ? 'border-indigo-600'
                : 'border-sky-600'
            }`}
          >
            About the Author
          </h2>

          <div className="flex gap-6 items-start">
            {author.photo_url && (
              <img
                src={author.photo_url}
                alt={author.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-sm flex-shrink-0"
              />
            )}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">{author.name}</h3>
              <p className="text-xs font-semibold text-indigo-600">{author.credentials}</p>
              <p className="text-xs text-slate-700 leading-relaxed">{author.bio}</p>
            </div>
          </div>
        </div>

        {/* PAGE 3: TABLE OF CONTENTS */}
        <div className="min-h-[70vh] py-12 border-b border-slate-200 print:border-none print:page-break-after-always space-y-6">
          <h2
            className={`text-2xl font-bold text-slate-900 pb-2 border-b-2 ${
              selectedTheme === 'academic'
                ? 'border-slate-900 font-serif'
                : selectedTheme === 'minimalist'
                ? 'border-zinc-300'
                : selectedTheme === 'creative'
                ? 'border-indigo-600'
                : 'border-sky-600'
            }`}
          >
            Table of Contents
          </h2>

          <div className="space-y-3">
            {safeWeeks.map((w) => (
              <div
                key={w.id}
                className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1 text-sm"
              >
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <span
                    className={
                      selectedTheme === 'academic'
                        ? 'text-slate-900 font-serif'
                        : selectedTheme === 'minimalist'
                        ? 'text-zinc-700 font-mono'
                        : selectedTheme === 'creative'
                        ? 'text-indigo-600'
                        : 'text-sky-700 font-mono'
                    }
                  >
                    Week {w.week_number}:
                  </span>
                  {w.topic}
                </span>
                <span className="text-xs text-slate-400 font-mono">Page {w.week_number + 3}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WEEKS CONTENT */}
        {safeWeeks.map((week) => (
          <div
            key={week.id}
            className="py-12 border-b border-slate-200 print:border-none print:page-break-after-always space-y-6"
          >
            <div
              className={`pb-3 flex justify-between items-end border-b-2 ${
                selectedTheme === 'academic'
                  ? 'border-slate-900'
                  : selectedTheme === 'minimalist'
                  ? 'border-zinc-300'
                  : selectedTheme === 'creative'
                  ? 'border-indigo-600'
                  : 'border-sky-600'
              }`}
            >
              <div>
                <span
                  className={`text-xs font-bold uppercase tracking-widest ${
                    selectedTheme === 'academic'
                      ? 'text-slate-900'
                      : selectedTheme === 'minimalist'
                      ? 'text-zinc-600 font-mono'
                      : selectedTheme === 'creative'
                      ? 'text-indigo-600'
                      : 'text-sky-700 font-mono'
                  }`}
                >
                  WEEK {week.week_number}
                </span>
                <h2
                  className={`text-2xl font-bold text-slate-900 ${
                    selectedTheme === 'academic' ? 'font-serif' : 'font-sans'
                  }`}
                >
                  {week.topic}
                </h2>
              </div>
              <span className="text-xs text-slate-400">{book.subject}</span>
            </div>

            {week.content_json?.map((sec, idx) => (
              <div key={idx} className="space-y-3">
                <h3
                  className={`text-base font-bold border-l-4 pl-3 py-0.5 ${
                    selectedTheme === 'academic'
                      ? 'border-slate-900 text-slate-900 font-serif'
                      : selectedTheme === 'minimalist'
                      ? 'border-zinc-400 text-zinc-800 border-l-2'
                      : selectedTheme === 'creative'
                      ? 'border-indigo-500 text-indigo-900 bg-indigo-50/50 rounded-r-lg'
                      : 'border-sky-600 text-sky-950 font-semibold'
                  }`}
                >
                  <FormattedText text={sec.subheading} />
                </h3>

                {sec.paragraphs?.map((p, pIdx) => {
                  const blocks = parseParagraphBlocks(p);
                  return (
                    <React.Fragment key={pIdx}>
                      {blocks.map((block, bIdx) => {
                        if (block.type === 'table') {
                          return (
                            <div key={bIdx} className="my-4 overflow-x-auto">
                              <table className="markdown-table w-full text-xs border-collapse border border-slate-300">
                                <thead>
                                  <tr
                                    className={
                                      selectedTheme === 'academic'
                                        ? 'bg-slate-900 text-white'
                                        : selectedTheme === 'minimalist'
                                        ? 'bg-zinc-100 text-zinc-800'
                                        : selectedTheme === 'creative'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-sky-900 text-white font-mono'
                                    }
                                  >
                                    {block.data.headers.map((h, hIdx) => (
                                      <th
                                        key={hIdx}
                                        className="border border-slate-300 px-3 py-2 text-left font-bold"
                                      >
                                        {cleanPlainText(h)}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {block.data.rows.map((row, rIdx) => (
                                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                      {row.map((cell, cIdx) => (
                                        <td key={cIdx} className="border border-slate-300 px-3 py-2 text-slate-700">
                                          {cleanPlainText(cell)}
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
                          <div key={bIdx} className="text-xs text-slate-700 leading-relaxed my-1">
                            <FormattedText text={block.content} />
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}

                {sec.table && !sec.paragraphs?.some((p) => parseMarkdownTable(p) !== null) && (
                  <div className="my-4 overflow-x-auto">
                    <table className="w-full text-xs border-collapse border border-slate-300">
                      <thead>
                        <tr
                          className={
                            selectedTheme === 'academic'
                              ? 'bg-slate-900 text-white'
                              : selectedTheme === 'minimalist'
                              ? 'bg-zinc-100 text-zinc-800'
                              : selectedTheme === 'creative'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-sky-900 text-white font-mono'
                          }
                        >
                          {sec.table.headers.map((h, hIdx) => (
                            <th
                              key={hIdx}
                              className="border border-slate-300 px-3 py-2 text-left font-bold"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sec.table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="border border-slate-300 px-3 py-2 text-slate-700">
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

            <div className="pt-6 text-right text-[11px] text-slate-400 border-t border-slate-100">
              {book.title} • Page {week.week_number + 3}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
