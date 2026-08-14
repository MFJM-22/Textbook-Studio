import React, { useState, useEffect } from 'react';
import { X, Upload, Sparkles, BookOpen, Check, FileText, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { AIProgressStepper, ProgressStep } from './AIProgressStepper';
import { processUploadedFiles } from '../lib/pdfUploader';

const creationSteps: ProgressStep[] = [
  { id: 'prep', label: '1. Optimization', description: 'Compressing and preparing scanned page assets' },
  { id: 'ocr', label: '2. Gemini Vision', description: 'Transcribing handwritten notes into clean text' },
  { id: 'db', label: '3. Project Setup', description: 'Initializing Firestore database entries' },
  { id: 'launch', label: '4. Opening Studio', description: 'Launching OCR verification workspace' },
];

interface NewBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBook: (bookData: {
    title: string;
    subject: string;
    class_level: string;
    term: string;
    uploaded_files?: { image_data?: string; raw_text?: string }[];
  }) => Promise<void> | void;
}

export const NewBookModal: React.FC<NewBookModalProps> = ({
  isOpen,
  onClose,
  onCreateBook,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [term, setTerm] = useState('1st Term');
  const [customTextNotes, setCustomTextNotes] = useState('');
  const [uploadedImages, setUploadedImages] = useState<{ image_data: string }[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  // AI Generation Stepper Progress State
  const [creationProgress, setCreationProgress] = useState(0);
  const [currentCreationStep, setCurrentCreationStep] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isSubmitting) {
      setCreationProgress(10);
      setCurrentCreationStep(0);
      timer = setInterval(() => {
        setCreationProgress((prev) => {
          if (prev < 30) {
            setCurrentCreationStep(0);
            return prev + 5;
          } else if (prev < 65) {
            setCurrentCreationStep(1);
            return prev + 4;
          } else if (prev < 90) {
            setCurrentCreationStep(2);
            return prev + 3;
          } else if (prev < 98) {
            setCurrentCreationStep(3);
            return prev + 1;
          }
          return prev;
        });
      }, 350);
    } else {
      setCreationProgress(0);
      setCurrentCreationStep(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSubmitting]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
      setTitle('');
      setSubject('');
      setClassLevel('');
      setTerm('1st Term');
      setCustomTextNotes('');
      setUploadedImages([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    setError(null);
    try {
      const pageList = await processUploadedFiles(Array.from(files) as File[]);
      const newImages = pageList.filter((p) => p.image_data).map((p) => ({ image_data: p.image_data! }));
      if (newImages.length > 0) {
        setUploadedImages((prev) => [...prev, ...newImages]);
      }
    } catch (err: any) {
      console.error('Error processing uploaded files:', err);
      setError(err.message || 'Error converting uploaded file.');
    } finally {
      setIsProcessingFiles(false);
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setIsProcessingFiles(true);
    setError(null);
    try {
      const pageList = await processUploadedFiles(Array.from(files) as File[]);
      const newImages = pageList.filter((p) => p.image_data).map((p) => ({ image_data: p.image_data! }));
      if (newImages.length > 0) {
        setUploadedImages((prev) => [...prev, ...newImages]);
      }
    } catch (err: any) {
      console.error('Error processing dropped files:', err);
      setError(err.message || 'Error converting dropped file.');
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your textbook project.');
      return;
    }
    if (!subject.trim()) {
      setError('Please provide a subject.');
      return;
    }
    if (!classLevel.trim()) {
      setError('Please specify the grade/class level.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const pagesToUpload: { image_data?: string; raw_text?: string }[] = [];

      if (uploadedImages.length > 0) {
        uploadedImages.forEach((img) => pagesToUpload.push({ image_data: img.image_data }));
      }

      if (customTextNotes.trim().length > 0) {
        pagesToUpload.push({ raw_text: customTextNotes });
      }

      await onCreateBook({
        title: title.trim(),
        subject: subject.trim(),
        class_level: classLevel.trim(),
        term,
        uploaded_files: pagesToUpload,
      });

      onClose();
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err?.message || 'Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/10 text-white animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-white/[0.03] border-b border-white/10 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg font-display text-white">New Textbook Project</h2>
              <p className="text-xs text-slate-400">Digitize teacher lesson notes into a curriculum textbook</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Textbook Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Essential Mathematics for Junior Secondary 2"
                className="w-full px-4 py-2.5 bg-white/5 text-white placeholder:text-slate-500 border border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Chemistry"
                  className="w-full px-4 py-2.5 bg-white/5 text-white placeholder:text-slate-500 border border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Class / Grade Level</label>
                <input
                  type="text"
                  required
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  placeholder="e.g. Grade 9 / JSS 3"
                  className="w-full px-4 py-2.5 bg-white/5 text-white placeholder:text-slate-500 border border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Term</label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0b0f17] text-white border border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/50 focus:outline-none"
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>
            </div>

            {/* Upload Scanned Notes or PDF */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Upload Scanned Pages / Photos / PDF Notes (Optional)
              </label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-white/15 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-all bg-white/[0.02]"
              >
                <input
                  type="file"
                  id="book-file-input"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="book-file-input" className="cursor-pointer block">
                  <Upload className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-80" />
                  <p className="text-xs font-bold text-white mb-1">
                    Click to browse files or drag and drop
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports JPG, PNG, WebP photos of handwritten notes or multi-page PDFs
                  </p>
                </label>
              </div>

              {isProcessingFiles && (
                <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing and rendering page assets...
                </div>
              )}

              {uploadedImages.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold text-slate-300 mb-2">
                    Attached Scanned Pages ({uploadedImages.length}):
                  </p>
                  <div className="flex gap-2 overflow-x-auto py-2">
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="relative shrink-0 w-16 h-20 rounded-lg overflow-hidden border border-white/20 group">
                        <img src={img.image_data} alt={`Page ${i+1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setUploadedImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Text / Syllabus Paste */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Paste Curriculum Notes or Syllabus Outline (Optional)
              </label>
              <textarea
                value={customTextNotes}
                onChange={(e) => setCustomTextNotes(e.target.value)}
                placeholder="Paste raw curriculum notes, weekly topics, or lesson plans here..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white/5 text-white placeholder:text-slate-500 border border-white/10 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/50 focus:outline-none leading-relaxed"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSubmitting && (
            <div className="my-4">
              <AIProgressStepper
                steps={creationSteps}
                currentStepIndex={currentCreationStep}
                progressPercent={creationProgress}
                statusTitle="Initializing Project & Vision OCR Pipeline"
                statusSubtitle="Extracting handwritten text, structuring weekly curriculum units, and saving..."
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Project...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Project & Start OCR
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
