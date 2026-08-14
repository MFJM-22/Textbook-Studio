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
  Play
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onOpenAuth,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedDemoTab, setSelectedDemoTab] = useState<'scan' | 'structure' | 'review'>('structure');

  const workflowSteps = [
    {
      step: '01',
      badge: 'Step 1: Raw Capture',
      title: 'Upload Scanned Notes or Camera Photos',
      description:
        'Upload raw handwritten teacher notes, syllabus outlines, or textbook scans. Our OCR vision engine extracts text without hallucinating extra content.',
      icon: UploadCloud,
      color: 'from-emerald-500 to-teal-600',
      tag: 'OCR Vision Active',
    },
    {
      step: '02',
      badge: 'Step 2: AI Structuring',
      title: 'Curriculum Structuring Engine',
      description:
        'Gemini AI structures raw extracted text directly into weekly lesson modules based strictly on uploaded source material.',
      icon: Brain,
      color: 'from-teal-500 to-emerald-600',
      tag: 'Gemini Vision',
    },
    {
      step: '03',
      badge: 'Step 3: Teacher Control',
      title: 'Human Review Gate & Editing',
      description:
        'Teachers retain 100% pedagogical authority. Review, edit text, add exercise questions, and refine lesson notes before final publishing.',
      icon: CheckSquare,
      color: 'from-emerald-400 to-emerald-600',
      tag: '100% Teacher Authority',
    },
    {
      step: '04',
      badge: 'Step 4: Publishing',
      title: 'Professional DOCX & PDF Export',
      description:
        'Export directly into Word (.docx) or download clean printable PDF textbook pages formatted with cover metadata and page numbering.',
      icon: Download,
      color: 'from-emerald-300 to-teal-500',
      tag: 'Print Ready',
    },
  ];

  return (
    <div className="bg-[#0b0f19] text-slate-100 min-h-screen overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* AMBIENT GLOWING ORBS */}
      <div className="relative isolate">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none opacity-25"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-600 via-blue-500 to-purple-600 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>

        {/* HERO SECTION */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-pill text-indigo-400 text-xs font-semibold tracking-wide border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]"></span>
              <span className="uppercase tracking-wider font-mono text-[11px]">Next-Gen AI Curriculum Studio</span>
            </div>

            {/* Reverted Website Hero Display Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white font-display leading-[1.08]">
              Transform raw teacher notes into{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                Textbooks
              </span>{' '}
              in minutes.
            </h1>

            {/* Reverted Website Sub-headline */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Upload handwritten notes, syllabus outlines, or camera scans. Textbook Studio automatically structures weekly modules, generates exercise questions, and exports print-ready DOCX & PDF textbooks.
            </p>

            {/* CTA Buttons */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
              <button
                onClick={onGetStarted}
                id="hero-get-started-btn"
                className="w-full sm:w-auto px-8 py-4 btn-primary font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(79,70,229,0.4)]"
              >
                <BookOpen className="w-4 h-4" />
                <span>Create Textbook Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Micro Badges */}
            <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-400" /> Firebase Auth Security
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" /> Word DOCX Export
              </span>
            </div>
          </div>

          {/* MOCKUP PREVIEW */}
          <div className="mt-8 sm:mt-12 relative max-w-4xl mx-auto">
            
            <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden border border-white/10">
              
              {/* Window Controls Bar */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40 border border-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40 border border-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/40 border border-indigo-500/60" />
                  <span className="text-[11px] text-slate-400/90 font-mono ml-2 hidden sm:inline">
                    textbook-studio // Integrated Science JSS2.docx
                  </span>
                </div>

                {/* Tabs inside mockup */}
                <div className="flex bg-white/5 p-0.5 rounded-full border border-white/10 text-[11px]">
                  <button
                    onClick={() => setSelectedDemoTab('scan')}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      selectedDemoTab === 'scan' ? 'bg-indigo-600 text-white font-bold shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    1. OCR Scan
                  </button>
                  <button
                    onClick={() => setSelectedDemoTab('structure')}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      selectedDemoTab === 'structure' ? 'bg-indigo-600 text-white font-bold shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    2. Curriculum Structure
                  </button>
                  <button
                    onClick={() => setSelectedDemoTab('review')}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      selectedDemoTab === 'review' ? 'bg-indigo-600 text-white font-bold shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    3. Teacher Gate
                  </button>
                </div>
              </div>

              {/* Dynamic Mockup Content */}
              {selectedDemoTab === 'scan' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-200">Scanned Teacher Note #1</span>
                      <span className="text-indigo-400 font-mono font-bold">100% Extract Match</span>
                    </div>
                    <div className="h-40 bg-slate-950/80 rounded-xl border border-white/10 p-3.5 font-mono text-xs text-slate-300 overflow-hidden leading-relaxed">
                      <p className="text-indigo-400">// OCR Vision Transcribed Text</p>
                      <p className="mt-1">Topic: Cell Structure & Living Organisms</p>
                      <p>Week 1: Plant vs Animal cells, Cytoplasm, Nucleus.</p>
                      <p>Lab Exercise: Draw and label a plant cell microscope slide.</p>
                    </div>
                  </div>
                  <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                        Multimodal OCR Vision
                      </span>
                      <h4 className="text-sm font-bold text-white mb-2 font-display">No Fabricated Content</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Transcribes exact handwritten teacher notes, tables, and lesson outline sheets without inventing extra material.
                      </p>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Ready for Curriculum Structuring
                      </div>
                      <button
                        onClick={() => setSelectedDemoTab('structure')}
                        className="px-3.5 py-1.5 btn-primary text-xs font-semibold"
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
                    <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono">Week 01</span>
                      <h4 className="text-xs font-bold text-white mt-1 font-display">Living Organisms & Cells</h4>
                      <p className="text-[11px] text-slate-300 mt-1">Organelles, Nucleus & Cell Membrane.</p>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl border border-white/10">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono">Week 02</span>
                      <h4 className="text-xs font-bold text-white mt-1 font-display">Classification of Living Things</h4>
                      <p className="text-[11px] text-slate-300 mt-1">Monera, Protista, Fungi & Plantae.</p>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl border border-white/10">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono">Week 03</span>
                      <h4 className="text-xs font-bold text-white mt-1 font-display">Plant Transport Systems</h4>
                      <p className="text-[11px] text-slate-300 mt-1">Xylem, Phloem & Transpiration stream.</p>
                    </div>
                  </div>
                  <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white font-display">Curriculum Auto-Structured</h5>
                        <p className="text-[11px] text-slate-400">Strictly matches uploaded lesson notes count</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDemoTab('review')}
                      className="px-4 py-2 btn-primary text-xs font-semibold"
                    >
                      Inspect Teacher Gate
                    </button>
                  </div>
                </div>
              )}

              {selectedDemoTab === 'review' && (
                <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-indigo-400" /> Human Review Gate Active
                    </span>
                    <span className="text-[11px] glass-pill px-2.5 py-0.5 rounded-full font-semibold">
                      Teacher Approved
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-2 bg-slate-950/80 p-4 rounded-xl border border-white/10">
                    <div className="flex justify-between font-semibold text-white">
                      <span>Chapter 1: Cell Structure & Functions</span>
                      <span className="text-slate-400 font-mono">Page 1 of 1</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      "Teachers retain 100% authority to edit text, insert custom diagrams, modify study questions, and review generated glossaries before exporting to DOCX or PDF."
                    </p>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={onGetStarted}
                      className="px-5 py-2.5 btn-primary text-xs font-bold"
                    >
                      Start Your Project &rarr;
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section id="workflow" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full glass-pill text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Publishing Workflow</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
              How Textbook Studio powers your <span className="text-indigo-400">publishing</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Transform rough teacher notes into complete, formatted educational textbooks in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflowSteps.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-6 rounded-3xl glass-panel glass-panel-hover transition-all cursor-pointer relative flex flex-col justify-between ${
                    activeStep === idx
                      ? 'border-indigo-500/50 bg-white/10 shadow-[0_0_30px_rgba(99,102,241,0.15)]'
                      : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold text-slate-400">{item.step}</span>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full glass-pill border border-indigo-500/30">
                        {item.tag}
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                      <IconComp className="w-6 h-6" />
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 leading-snug font-display">{item.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-16 sm:py-24 border-t border-white/10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full glass-pill text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Core Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
              Built for Teachers, Schools & Educational Publishers
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              High precision OCR, curriculum structuring, and print publishing tools in one workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 glass-panel glass-panel-hover rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-display">Multimodal OCR Vision</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Accepts camera snapshots, PDFs, and handwritten notes. Transcribes exact equations, diagrams, and topic headers without fabrication.
              </p>
            </div>

            <div className="p-6 glass-panel glass-panel-hover rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-display">Curriculum AI Structuring</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Structures raw material directly into weekly lesson plans, learning objectives, and review questions matching the source notes.
              </p>
            </div>

            <div className="p-6 glass-panel glass-panel-hover rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-display">Human Review Gate</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                100% teacher authority. Edit AI-generated text, adjust difficulty levels, and refine weekly content before finalizing.
              </p>
            </div>

            <div className="p-6 glass-panel glass-panel-hover rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-display">Word DOCX Export</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Outputs clean Word documents formatted with cover pages, table of contents, headers, footers, and page breaks.
              </p>
            </div>

            <div className="p-6 glass-panel glass-panel-hover rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
                <Book className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-display">Printable PDF Studio</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Generates high-resolution PDF previews formatted for standard letter/A4 printing directly from your browser.
              </p>
            </div>

            <div className="p-6 glass-panel glass-panel-hover rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-display">Firebase Auth Security</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your textbook projects and teacher files are isolated and stored securely under your account with Firestore security rules.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

