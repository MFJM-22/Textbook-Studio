import React, { useState, useEffect } from 'react';
import { X, Upload, Sparkles, BookOpen, Check, FileText } from 'lucide-react';
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
  }) => void;
}

export const NewBookModal: React.FC<NewBookModalProps> = ({
  isOpen,
  onClose,
  onCreateBook,
}) => {
  const [activeTab, setActiveTab] = useState<'sample' | 'custom'>('custom');
  const [samples, setSamples] = useState<SampleNote[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');

  // Custom fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Biology');
  const [classLevel, setClassLevel] = useState('Grade 9');
  const [term, setTerm] = useState('1st Term');
  const [customTextNotes, setCustomTextNotes] = useState('');
  const [uploadedImages, setUploadedImages] = useState<{ image_data: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages((prev) => [
            ...prev,
            { image_data: event.target!.result as string },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'sample') {
      const selectedSample = samples.find((s) => s.id === selectedSampleId);
      onCreateBook({
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

      onCreateBook({
        title: title || `${subject} ${classLevel} Textbook`,
        subject,
        class_level: classLevel,
        term,
        uploaded_files: pagesToUpload,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-base">New Textbook Project</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {samples.length > 0 && (
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('sample')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                activeTab === 'sample'
                  ? 'bg-white border-blue-600 text-blue-600 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Use Demo Teacher Notes Dataset
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                activeTab === 'custom'
                  ? 'bg-white border-blue-600 text-blue-600 shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4 text-blue-500" />
              Upload Scanned Notes / Text
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
          {activeTab === 'sample' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                Select a pre-loaded teacher notes package to immediately test the OCR pipeline, AI week-by-week structuring, glossary builder, and Word/PDF publishing!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {samples.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSampleId(s.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedSampleId === s.id
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {s.subject} • {s.class_level}
                      </span>
                      {selectedSampleId === s.id && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{s.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>
                    <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Chemistry"
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Class Level *</label>
                  <input
                    type="text"
                    required
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    placeholder="e.g. Grade 11"
                    className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Term *</label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1st Term">1st Term</option>
                    <option value="2nd Term">2nd Term</option>
                    <option value="3rd Term">3rd Term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Textbook Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`e.g. ${classLevel} ${subject} Coursebook`}
                  className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Upload Scanned Pages (Images)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-medium">Click to upload scanned handwritten note images</p>
                  <p className="text-[11px] text-slate-400 mb-2">Supports JPG, PNG, WEBP</p>
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
                    className="inline-block px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-slate-700"
                  >
                    Select Page Files
                  </label>

                  {uploadedImages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 justify-center">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="relative w-12 h-12 rounded border overflow-hidden">
                          <img src={img.image_data} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 right-0 bg-blue-600 text-white text-[10px] px-1 font-bold">
                            #{i + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Or Paste Raw Typed Notes</label>
                <textarea
                  rows={4}
                  value={customTextNotes}
                  onChange={(e) => setCustomTextNotes(e.target.value)}
                  placeholder="Paste teacher lesson outline text, tables, or notes here..."
                  className="w-full px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-create-book-btn"
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              Create & Process Notes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
