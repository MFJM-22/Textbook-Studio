import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Zap,
  Shield,
  FileText,
  CheckCircle2,
  ArrowRight,
  UploadCloud,
  Layers,
  CheckSquare,
  Download,
  Book,
  Brain,
  Award,
  Users,
  Lock,
  Eye,
  ChevronRight,
  Globe,
  Star,
  Play
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenAuth: () => void;
  onLoadSample: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onOpenAuth,
  onLoadSample,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedDemoTab, setSelectedDemoTab] = useState<'scan' | 'structure' | 'review'>('structure');

  const workflowSteps = [
    {
      step: '01',
      badge: 'Step 1: Raw Capture',
      title: 'Upload Scanned Notes or Camera Photos',
      description:
        'Upload raw handwritten teacher notes, syllabus outlines, or textbook scans. Our OCR vision engine extracts raw text and assigns confidence scores.',
      icon: UploadCloud,
      color: 'from-blue-500 to-indigo-600',
      tag: 'OCR Vision Active',
    },
    {
      step: '02',
      badge: 'Step 2: AI Structuring',
      title: 'Automated Week-by-Week Curriculum Engine',
      description:
        'Gemini AI reorganizes raw text into structured 12–16 week modules, matching Ministry & STEM education standards with clear learning goals.',
      icon: Brain,
      color: 'from-purple-500 to-indigo-600',
      tag: 'Gemini 2.5 Flash',
    },
    {
      step: '03',
      badge: 'Step 3: Teacher Control',
      title: 'Human Review Gate & Customization',
      description:
        'Maintain complete pedagogical authority. Review, edit, add exercise questions, and refine lesson notes before final publishing.',
      icon: CheckSquare,
      color: 'from-emerald-500 to-teal-600',
      tag: '100% Teacher Authority',
    },
    {
      step: '04',
      badge: 'Step 4: Publishing',
      title: 'Glossary Builder & Professional DOCX/PDF Export',
      description:
        'Auto-generate subject glossaries, formatted page headers, exercise sections, and export directly into Word DOCX or PDF for printing.',
      icon: Download,
      color: 'from-amber-500 to-orange-600',
      tag: 'Print Ready',
    },
  ];

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* BACKGROUND LIGHT ATMOSPHERIC SHADOWS */}
      <div className="relative isolate">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none opacity-40"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-200 to-blue-200 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>

        {/* HERO SECTION */}
        <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-5 max-w-4xl mx-auto">
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/90 text-indigo-700 text-xs font-semibold shadow-xs hover:border-indigo-200 transition-all">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>Next-Gen AI Curriculum Publishing Studio</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Transform raw teacher notes into{' '}
              <span className="inline-block relative px-4 py-1 my-1 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20 transform -rotate-1">
                Textbooks
              </span>{' '}
              in minutes
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              Upload handwritten notes, syllabus outlines, or camera scans. Textbook Studio automatically structures weekly modules, generates exercise questions, and exports print-ready DOCX textbooks.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={onGetStarted}
                id="hero-get-started-btn"
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-full shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <span>Create Textbook Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Micro Badges */}
            <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" /> Firebase Auth Security
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" /> Word DOCX Export Ready
              </span>
            </div>
          </div>

          {/* FLOATING APP MOCKUP PREVIEW (Light Theme) */}
          <div className="mt-10 sm:mt-14 relative max-w-5xl mx-auto">
            
            <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
              
              {/* Window Controls Bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="text-xs text-slate-500 font-mono ml-2 hidden sm:inline">
                    textbook-studio // Integrated Science JSS2.docx
                  </span>
                </div>

                {/* Tabs inside mockup */}
                <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/80 text-xs">
                  <button
                    onClick={() => setSelectedDemoTab('scan')}
                    className={`px-3 py-1 rounded-full font-medium transition-colors ${
                      selectedDemoTab === 'scan' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    1. OCR Scan
                  </button>
                  <button
                    onClick={() => setSelectedDemoTab('structure')}
                    className={`px-3 py-1 rounded-full font-medium transition-colors ${
                      selectedDemoTab === 'structure' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    2. Week Structure
                  </button>
                  <button
                    onClick={() => setSelectedDemoTab('review')}
                    className={`px-3 py-1 rounded-full font-medium transition-colors ${
                      selectedDemoTab === 'review' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    3. Human Gate
                  </button>
                </div>
              </div>

              {/* Dynamic Mockup Content */}
              {selectedDemoTab === 'scan' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Scanned Teacher Note #1</span>
                      <span className="text-emerald-700 font-mono font-bold">98.5% Match</span>
                    </div>
                    <div className="h-40 bg-white rounded-xl border border-dashed border-slate-300 p-3 font-mono text-xs text-slate-600 overflow-hidden leading-relaxed">
                      <p className="text-indigo-600">// OCR Vision Raw Output</p>
                      <p className="mt-1">Topic: Cell Structure & Living Organisms</p>
                      <p>Week 1: Plant vs Animal cells, Cytoplasm, Nucleus.</p>
                      <p>Lab Exercise: Draw and label a plant cell microscope slide.</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                        OCR Confidence Analysis
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mb-2">High Precision Handwriting Extraction</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Recognizes complex formulas, diagrams, bullet points, and margin teacher notes automatically.
                      </p>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ready for AI Structuring
                      </div>
                      <button
                        onClick={() => setSelectedDemoTab('structure')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold shadow-xs"
                      >
                        Next Step &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedDemoTab === 'structure' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-200/80">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase">Week 01</span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">Living Organisms & Cells</h4>
                      <p className="text-[11px] text-slate-600 mt-1">Organelles, Nucleus & Cell Membrane.</p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-blue-600 uppercase">Week 02</span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">Classification of Living Things</h4>
                      <p className="text-[11px] text-slate-600 mt-1">Monera, Protista, Fungi & Plantae.</p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Week 03</span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">Plant Transport Systems</h4>
                      <p className="text-[11px] text-slate-600 mt-1">Xylem, Phloem & Transpiration stream.</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">12-Week Curriculum Auto-Generated</h5>
                        <p className="text-[11px] text-slate-500">Complete with learning outcomes & weekly exercises</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDemoTab('review')}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-xs"
                    >
                      Inspect Human Gate
                    </button>
                  </div>
                </div>
              )}

              {selectedDemoTab === 'review' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-600" /> Human Review Gate Active
                    </span>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                      Teacher Approved
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>Chapter 1: Cell Structure & Functions</span>
                      <span className="text-slate-400">Page 4 of 28</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      "Teachers retain 100% authority to edit text, insert custom diagrams, modify study questions, and review generated glossaries before exporting to DOCX."
                    </p>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={onGetStarted}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-full shadow-md"
                    >
                      Start Your Project &rarr;
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section className="border-y border-slate-200/80 bg-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-5">
              Built for Teachers, Lecturers & Educational Institutions
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">98.4%</div>
                <div className="text-xs text-slate-500 mt-0.5">OCR Hand-written Accuracy</div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">12 Weeks</div>
                <div className="text-xs text-slate-500 mt-0.5">Structured per Term</div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-extrabold text-purple-600">1-Click</div>
                <div className="text-xs text-slate-500 mt-0.5">DOCX & PDF Export</div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">100%</div>
                <div className="text-xs text-slate-500 mt-0.5">Teacher Control & Auth</div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section id="workflow" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Our Publishing Workflow</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How Textbook Studio makes your publishing <span className="text-indigo-600">easier</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Transform rough notes into complete, formatted educational textbooks through four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflowSteps.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    activeStep === idx
                      ? 'bg-white border-indigo-300 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white/80 border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-slate-400">{item.step}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-indigo-700 border border-slate-200">
                        {item.tag}
                      </span>
                    </div>

                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md mb-3`}>
                      <IconComp className="w-5 h-5" />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-16 sm:py-20 border-t border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>Core Capabilities</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything you need to publish school textbooks
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Built with security, pedagogical accuracy, and print standards at its core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-2.5 hover:border-indigo-200 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                <UploadCloud className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Multimodal OCR Vision</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accepts camera snapshots, PDFs, and handwritten notes. Extracts equations, diagrams, and topic headers seamlessly.
              </p>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-2.5 hover:border-indigo-200 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-2">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Curriculum AI Structuring</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Organizes raw material into structured weekly lesson plans, learning objectives, and end-of-week practice questions.
              </p>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-2.5 hover:border-indigo-200 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Human-in-the-Loop Review</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Never lose control. Edit AI-generated text, adjust difficulty levels, and refine weekly content before finalizing.
              </p>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-2.5 hover:border-indigo-200 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 mb-2">
                <Book className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Auto Subject Glossary</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically identifies key terms and definitions across all weeks to generate a complete end-of-book glossary.
              </p>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-2.5 hover:border-indigo-200 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">DOCX & PDF Print Export</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Outputs clean Word documents formatted with cover pages, table of contents, headers, footers, and page breaks.
              </p>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-3xl space-y-2.5 hover:border-indigo-200 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 mb-2">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Firebase Auth & Firestore Isolation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your textbook projects and teacher files are isolated and stored securely under your account with Firestore database rules.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
