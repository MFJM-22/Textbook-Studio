import React, { useState } from 'react';
import { Printer, ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import { Author, Book, Week, GlossaryTerm } from '../types';
import { parseMarkdownTable } from '../lib/docGenerator';
import { downloadBookPdfClient } from '../lib/pdfGenerator';

interface PrintPDFPreviewProps {
  book: Book;
  author: Author;
  weeks: Week[];
  glossary?: GlossaryTerm[];
  onBack: () => void;
  onExportDocx: () => void;
}

export const PrintPDFPreview: React.FC<PrintPDFPreviewProps> = ({
  book,
  author,
  weeks,
  glossary,
  onBack,
  onExportDocx,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      downloadBookPdfClient(book, author, safeWeeks, glossary);
    } catch (err) {
      console.error('Direct PDF generation error:', err);
      // Fallback to browser print dialog
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
      <div className="bg-[#0b0f19] border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-40 print:hidden text-slate-100 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-white font-display">Textbook Print & PDF Studio</h2>
            <p className="text-xs text-slate-400">{book.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExportDocx}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            Download Word (.docx)
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            id="download-pdf-btn"
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer disabled:cursor-wait"
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
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Print Document
          </button>
        </div>
      </div>

      {/* Printable Textbook Pages Container */}
      <div
        id="printable-textbook-content"
        className="max-w-4xl mx-auto my-8 print:my-0 p-8 sm:p-12 bg-white rounded-2xl shadow-2xl print:shadow-none border border-slate-200 print:border-none space-y-16 print:space-y-0"
      >
        {/* PAGE 1: COVER PAGE */}
        <div className="min-h-[85vh] flex flex-col justify-between items-center text-center py-16 border-b border-slate-200 print:border-none print:page-break-after-always">
          <div className="space-y-4 max-w-xl mx-auto my-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 px-3 py-1 bg-blue-50 rounded-full border border-blue-100">
              {book.subject} • {book.class_level} • {book.term}
            </span>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {book.title}
            </h1>

            <div className="w-24 h-1 bg-blue-600 mx-auto my-6"></div>

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
          <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2">
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
              <p className="text-xs font-semibold text-blue-600">{author.credentials}</p>
              <p className="text-xs text-slate-700 leading-relaxed">{author.bio}</p>
            </div>
          </div>
        </div>

        {/* PAGE 3: TABLE OF CONTENTS */}
        <div className="min-h-[70vh] py-12 border-b border-slate-200 print:border-none print:page-break-after-always space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2">
            Table of Contents
          </h2>

          <div className="space-y-3">
            {safeWeeks.map((w) => (
              <div
                key={w.id}
                className="flex items-baseline justify-between border-b border-dotted border-slate-300 pb-1 text-sm"
              >
                <span className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-blue-600">Week {w.week_number}:</span>
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
            <div className="border-b-2 border-blue-600 pb-3 flex justify-between items-end">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                  WEEK {week.week_number}
                </span>
                <h2 className="text-2xl font-bold text-slate-900">{week.topic}</h2>
              </div>
              <span className="text-xs text-slate-400">{book.subject}</span>
            </div>

            {week.content_json?.map((sec, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-base font-bold text-slate-800 border-l-4 border-blue-500 pl-2">
                  {sec.subheading}
                </h3>

                {sec.paragraphs?.map((p, pIdx) => {
                  const tableData = parseMarkdownTable(p);
                  if (tableData) {
                    return (
                      <div key={pIdx} className="my-4 overflow-x-auto">
                        <table className="w-full text-xs border-collapse border border-slate-300">
                          <thead>
                            <tr className="bg-slate-100">
                              {tableData.headers.map((h, hIdx) => (
                                <th
                                  key={hIdx}
                                  className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-800"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tableData.rows.map((row, rIdx) => (
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
                    );
                  }

                  return (
                    <p key={pIdx} className="text-xs text-slate-700 leading-relaxed">
                      {p}
                    </p>
                  );
                })}

                {sec.table && !sec.paragraphs?.some((p) => parseMarkdownTable(p) !== null) && (
                  <div className="my-4 overflow-x-auto">
                    <table className="w-full text-xs border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100">
                          {sec.table.headers.map((h, hIdx) => (
                            <th
                              key={hIdx}
                              className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-800"
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
