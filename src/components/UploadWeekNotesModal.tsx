import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Sparkles, Loader2, CheckCircle, Image as ImageIcon, Plus } from 'lucide-react';
import { Week } from '../types';
import { processUploadedFiles, PageUploadItem } from '../lib/pdfUploader';

interface UploadWeekNotesModalProps {
  isOpen: boolean;
  nextWeekNumber: number;
  bookId: string;
  onClose: () => void;
  onWeekCreated: (newWeek: Week) => void;
  onAddBlankWeek: () => void;
}

export const UploadWeekNotesModal: React.FC<UploadWeekNotesModalProps> = ({
  isOpen,
  nextWeekNumber,
  bookId,
  onClose,
  onWeekCreated,
  onAddBlankWeek,
}) => {
  const [items, setItems] = useState<PageUploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>(`Week ${nextWeekNumber} Lesson Unit`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setIsProcessing(true);
    setStatusMsg('Processing scanned notes & PDF pages...');
    try {
      const processed = await processUploadedFiles(files);
      setItems((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('File process error:', err);
      alert('Unable to process uploaded notes. Please try uploading JPEG, PNG, or PDF files.');
    } finally {
      setIsProcessing(false);
      setStatusMsg('');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []) as File[];
    if (files.length === 0) return;

    setIsProcessing(true);
    setStatusMsg('Processing scanned notes & PDF pages...');
    try {
      const processed = await processUploadedFiles(files);
      setItems((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('File process error:', err);
      alert('Unable to process uploaded notes.');
    } finally {
      setIsProcessing(false);
      setStatusMsg('');
    }
  };

  const handleTranscribeAndBuildWeek = async () => {
    if (items.length === 0) {
      alert('Please select or upload at least one scanned note page or image.');
      return;
    }

    setIsProcessing(true);
    setStatusMsg(`Transcribing scanned notes for Week ${nextWeekNumber} using Gemini Vision AI...`);

    try {
      // 1. Transcribe pages via API
      let combinedTranscribedText = '';

      for (let i = 0; i < items.length; i++) {
        setStatusMsg(`Transcribing note page ${i + 1} of ${items.length}...`);
        const item = items[i];

        if (item.image_data) {
          const res = await fetch('/api/transcribe-handwriting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_data: item.image_data, raw_text: item.raw_text }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              combinedTranscribedText += `\n\n--- PAGE ${i + 1} NOTES ---\n` + data.text;
            }
          }
        } else if (item.raw_text) {
          combinedTranscribedText += `\n\n--- PAGE ${i + 1} NOTES ---\n` + item.raw_text;
        }
      }

      setStatusMsg('Structuring transcribed notes into curriculum sections & tables...');

      // 2. Build structured sections from transcribed notes
      const sections: { subheading: string; paragraphs: string[] }[] = [];

      if (combinedTranscribedText.trim()) {
        const rawBlocks = combinedTranscribedText
          .split(/(?=###|\n\n(?=[A-Z0-9\s:-]{3,40}\n))/)
          .map((b) => b.trim())
          .filter((b) => b.length > 0);

        if (rawBlocks.length > 0) {
          rawBlocks.forEach((block, idx) => {
            const lines = block.split('\n').filter((l) => l.trim().length > 0);
            let subheading = lines[0].replace(/^#+\s*/, '').replace(/---/g, '').trim();
            if (!subheading || subheading.length > 60) {
              subheading = `Lesson Section ${idx + 1}: Core Concepts`;
            }
            const paragraphs = lines.slice(subheading === lines[0] ? 1 : 0);
            sections.push({
              subheading,
              paragraphs: paragraphs.length > 0 ? paragraphs : [block],
            });
          });
        } else {
          sections.push({
            subheading: 'Scanned Notes Transcription',
            paragraphs: [combinedTranscribedText.trim()],
          });
        }
      } else {
        sections.push({
          subheading: 'Core Unit Notes',
          paragraphs: ['Add lesson notes content here...'],
        });
      }

      const createdWeek: Week = {
        id: `w-scanned-${Date.now()}`,
        book_id: bookId,
        week_number: nextWeekNumber,
        topic: customTopic.trim() || `Week ${nextWeekNumber}: Scanned Notes Unit`,
        content_json: sections,
        created_at: new Date().toISOString(),
      };

      onWeekCreated(createdWeek);
      onClose();
    } catch (err: any) {
      console.error('OCR / Transcribe week error:', err);
      alert('An error occurred while processing scanned notes. Adding a blank week structure instead.');
      onAddBlankWeek();
      onClose();
    } finally {
      setIsProcessing(false);
      setStatusMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel bg-[#0b0f19] rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-white/10 animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/10 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Upload className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-bold text-base font-display text-white">
                Add Week {nextWeekNumber}: Upload Scanned Notes
              </h2>
              <p className="text-[11px] text-slate-400">
                Upload handwritten or typed notes for this new curriculum week
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              Week Topic / Title
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder={`e.g. Week ${nextWeekNumber}: Photosynthesis & Plant Biology`}
              className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-full font-bold text-white focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
            />
          </div>

          {/* Drag & Drop Dropzone */}
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              Scanned Pages & Images
            </label>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="font-bold text-indigo-200">
                Click or drop scanned notes & PDF files here
              </p>
              <p className="text-[11px] text-slate-400">
                Supports handwritten notes, typed handouts, and PDF workbooks (JPG, PNG, PDF)
              </p>
            </div>
          </div>

          {/* Processed Thumbnails */}
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span>Selected Note Pages ({items.length})</span>
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-rose-400 hover:underline text-[11px]"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2.5 max-h-36 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-white/5">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-[3/4] bg-slate-950 rounded-lg overflow-hidden border border-white/10 group"
                  >
                    {item.image_data ? (
                      <img
                        src={item.image_data}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px] p-1 text-center font-mono">
                        Page {idx + 1} Text
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItems(items.filter((_, i) => i !== idx));
                        }}
                        className="p-1 bg-rose-600 text-white rounded-full hover:bg-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Spinner */}
          {isProcessing && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center gap-2 text-indigo-300">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-indigo-400" />
              <span className="font-medium text-xs">{statusMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onAddBlankWeek();
                onClose();
              }}
              disabled={isProcessing}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              Skip & Add Blank Week
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 border border-white/10 text-slate-300 rounded-full hover:bg-white/10 transition-colors font-medium cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleTranscribeAndBuildWeek}
                disabled={isProcessing || items.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-full font-semibold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Extract Notes & Create Week
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
