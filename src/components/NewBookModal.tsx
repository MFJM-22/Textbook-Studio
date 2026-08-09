import React, { useState, useEffect } from 'react';
import { X, Upload, Sparkles, BookOpen, Check, FileText, Loader2, AlertCircle } from 'lucide-react';
import { SampleNote } from '../types';

interface NewBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBook: (bookData: {
    title: string;
    subject: string;
    class_level: string;
    term: string;
    sample_id?: string;
    uploaded_files?: { image_data?: string; raw_text?: string }[];
  }) => Promise<void> | void;
}

export const NewBookModal: React.FC<NewBookModalProps> = ({
  isOpen,
  onClose,
  onCreateBook,
}) => {
  const [activeTab, setActiveTab] = useState<'sample' | 'custom'>('custom');
  const [samples, setSamples] = useState<SampleNote[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Integrated Science');
  const [classLevel, setClassLevel] = useState('JSS 2');
  const [term, setTerm] = useState('2nd Term');
  const [customTextNotes, setCustomTextNotes] = useState('');
  const [uploadedImages, setUploadedImages] = useState<{ image_data: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
      fetch('/api/sample-notes')
        .then((res) => res.json())
        .then((data) => {
          setSamples(data);
          if (data.length > 0) setSelectedSampleId(data[0].id);
        })
        .catch((err) => console.error('Failed loading sample notes:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files) as File[]) {
      try {
        const compressedData = await compressImage(file);
        if (compressedData) {
          setUploadedImages((prev) => [...prev, { image_data: compressedData }]);
        }
      } catch (err) {
        console.error('Error compressing uploaded image:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (activeTab === 'sample') {
        const selectedSample = samples.find((s) => s.id === selectedSampleId);
        await onCreateBook({
          title: title || selectedSample?.title || 'New Textbook',
          subject: selectedSample?.subject || subject,
          class_level: selectedSample?.class_level || classLevel,
          term: selectedSample?.term || term,
          sample_id: selectedSampleId,
        });
      } else {
        const pagesToUpload: { image_data?: string; raw_text?: string }[] = [];

        if (uploadedImages.length > 0) {
          uploadedImages.forEach((img) => pagesToUpload.push({ image_data: img.image_data }));
        }

        if (customTextNotes.trim().length > 0) {
          pagesToUpload.push({ raw_text: customTextNotes });
        }

        await onCreateBook({
          title: title || `${subject} ${classLevel} Textbook`,
          subject,
          class_level: classLevel,
          term,
          uploaded_files: pagesToUpload,
        });
      }
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
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg font-display text-white">New Textbook Project</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {samples.length > 0 && (
          <div className="flex border-b border-white/10 bg-black/20 px-6 pt-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('sample')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all ${
                activeTab === 'sample'
                  ? 'bg-white/10 text-emerald-400 border-t-2 border-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Use Demo Teacher Notes Dataset
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all ${
                activeTab === 'custom'
                  ? 'bg-white/10 text-emerald-400 border-t-2 border-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              Upload Scanned Notes / Text
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
          {activeTab === 'sample' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 glass-panel p-4 rounded-2xl border border-white/10 leading-relaxed">
                Select a pre-loaded teacher notes package to immediately test the OCR vision pipeline, AI week-by-week structuring, glossary builder, and Word/PDF publishing!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {samples.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSampleId(s.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedSampleId === s.id
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'border-white/10 hover:border-emerald-500/40 bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full glass-pill border border-emerald-500/30">
                        {s.subject} • {s.class_level}
                      </span>
                      {selectedSampleId === s.id && (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1 font-display">{s.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{s.description}</p>
                    <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      {s.sample_pages.length} pages of scanned notes
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Subject *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Chemistry"
                    className="w-full px-4 py-2.5 bg-white/5 text-white placeholder:text-slate-500 border border-white/10 rounded-full text-xs focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Class Level *</label>
                  <input
                    type="text"
                    required
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    placeholder="e.g. Grade 11"
                    className="w-full px-4 py-2.5 bg-white/5 text-white placeholder:text-slate-500 border border-white/10 rounded-full text-xs focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Term *</label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0b0f17] text-white border border-white/10 rounded-full text-xs focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="1st Term">1st Term</option>
                    <option value="2nd Term">2nd Term</option>
                    <option value="3rd Term">3rd Term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Textbook Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`e.g. ${classLevel} ${subject} Coursebook`}
                  className="w-full px-4 py-2.5 bg-white/5 text-white placeholder:text-slate-500 border border-white/10 rounded-full text-xs focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Upload Scanned Pages (Images)</label>
                <div className="border-2 border-dashed border-white/15 rounded-2xl p-5 text-center hover:bg-white/5 transition-colors bg-white/[0.02]">
                  <Upload className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-200 font-medium">Click to upload scanned handwritten note images</p>
                  <p className="text-[11px] text-slate-400 mb-3">Supports JPG, PNG, WEBP</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="page-images-input"
                  />
                  <label
                    htmlFor="page-images-input"
                    className="inline-block px-5 py-2 btn-emerald text-xs font-bold cursor-pointer shadow-md"
                  >
                    Select Page Files
                  </label>

                  {uploadedImages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 justify-center">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="relative w-12 h-12 rounded-xl border border-white/20 overflow-hidden shadow-xs">
                          <img src={img.image_data} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 right-0 bg-emerald-500 text-slate-950 text-[9px] px-1 font-bold">
                            #{i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Or Paste Raw Typed Notes</label>
                <textarea
                  rows={4}
                  value={customTextNotes}
                  onChange={(e) => setCustomTextNotes(e.target.value)}
                  placeholder="Paste teacher lesson outline text, tables, or notes here..."
                  className="w-full p-3.5 bg-white/5 text-white placeholder:text-slate-500 border border-white/10 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-5 py-2 btn-glass text-xs font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="confirm-create-book-btn"
              className="flex items-center gap-2 px-6 py-2 btn-emerald text-xs font-bold disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Processing Notes & OCR...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Create & Process Notes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

