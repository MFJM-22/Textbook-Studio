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
      color: 'from-purple-500 to-pink-600',
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
    <div className="bg-slate-950 text-slate-100 min-h-screen overflow-hidden selection:bg-purple-500 selection:text-white">
      
      {/* BACKGROUND ATMOSPHERIC GRADIENTS (Inspired by reference UI) */}
      <div className="relative isolate">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#7c3aed] to-[#3b82f6] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>

        {/* HERO SECTION */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-semibold shadow-lg shadow-purple-900/20 animate-fade-in backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>Next-Gen AI Curriculum Publishing Studio</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>

            {/* Main Headline with Highlight Pill (matching Nicepay inspiration) */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Transform raw teacher notes into{' '}
              <span className="inline-block relative px-3 sm:px-4 py-1 my-1 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white shadow-xl shadow-indigo-600/30 border border-purple-400/30 transform -rotate-1">
                Textbooks
              </span>{' '}
              in minutes
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Upload handwritten notes, syllabus outlines, or camera scans. Textbook Studio automatically structures weekly modules, generates exercise questions, and exports print-ready DOCX textbooks.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={onGetStarted}
                id="hero-get-started-btn"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <span>Create Textbook Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Small Trust Micro-Badge */}
            <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-400" /> Firebase Auth Security
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-400" /> Word DOCX Export Ready
              </span>
            </div>
          </div>

          {/* FLOATING APP MOCKUP PREVIEW (Inspired by Nicepay center mockup) */}
          <div className="mt-12 sm:mt-16 relative max-w-5xl mx-auto">
            
            {/* Glowing backdrop shadow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-blue-600/30 blur-3xl rounded-3xl -z-10 transform scale-95" />

            <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              
              {/* Window Controls Bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="text-xs text-slate-400 font-mono ml-2 hidden sm:inline">
                    textbook-studio // Physics-101-Term1.docx
                  </span>
                </div>

                {/* Tabs inside mockup */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setSelectedDemoTab('scan')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      selectedDemoTab === 'scan' ? 'bg-purple-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    1. OCR Scan
                  </button>
                  <button
                    onClick={() => setSelectedDemoTab('structure')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      selectedDemoTab === 'structure' ? 'bg-purple-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    2. Week Structure
                  </button>
                  <button
                    onClick={() => setSelectedDemoTab('review')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      selectedDemoTab === 'review' ? 'bg-purple-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    3. Human Gate
                  </button>
                </div>
              </div>

              {/* Dynamic Mockup Content */}
              {selectedDemoTab === 'scan' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Scanned Teacher Note #1</span>
                      <span className="text-emerald-400 font-mono font-bold">98.5% Match</span>
                    </div>
                    <div className="h-40 bg-slate-950 rounded-xl border border-dashed border-slate-800 p-3 font-mono text-xs text-slate-400 overflow-hidden leading-relaxed">
                      <p className="text-purple-300">// OCR Vision Raw Output</p>
                      <p className="mt-1">Topic: Newton’s Laws of Motion & Thermodynamics</p>
                      <p>Week 1: Inertia, Force = Mass x Acceleration, Action & Reaction.</p>
                      <p>Lab Exercise: Calculate acceleration of a 500kg car with 2000N force.</p>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
                        OCR Confidence Analysis
                      </span>
                      <h4 className="text-sm font-bold text-white mb-2">High Precision Handwriting Extraction</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Recognizes complex formulas, diagrams, bullet points, and margin teacher notes automatically.
                      </p>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ready for AI Structuring
                      </div>
                      <button
                        onClick={() => setSelectedDemoTab('structure')}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold"
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
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-purple-500/40 bg-purple-950/20">
                      <span className="text-[10px] font-bold text-purple-400 uppercase">Week 01</span>
                      <h4 className="text-xs font-bold text-white mt-1">Introduction to Motion</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Inertia, Force vectors & Newton's 1st Law.</p>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-bold text-blue-400 uppercase">Week 02</span>
                      <h4 className="text-xs font-bold text-white mt-1">Friction & Acceleration</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Static friction vs kinetic friction coefficient.</p>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Week 03</span>
                      <h4 className="text-xs font-bold text-white mt-1">Energy & Work Done</h4>
                      <p className="text-[11px] text-slate-400 mt-1">Kinetic energy, potential energy & conservation.</p>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">12-Week Curriculum Auto-Generated</h5>
                        <p className="text-[11px] text-slate-400">Complete with learning outcomes & weekly exercises</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDemoTab('review')}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg"
                    >
                      Inspect Human Gate
                    </button>
                  </div>
                </div>
              )}

              {selectedDemoTab === 'review' && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> Human Review Gate Active
                    </span>
                    <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-md font-semibold">
                      Teacher Approved
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between font-semibold text-white">
                      <span>Chapter 1: Forces & Vectors</span>
                      <span className="text-slate-400">Page 4 of 28</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      "Teachers can edit text, insert custom diagrams, modify study questions, and review generated glossaries before exporting to DOCX."
                    </p>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={onGetStarted}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg"
                    >
                      Start Your Project &rarr;
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* TRUSTED / STATS BAR */}
        <section className="border-y border-slate-800/80 bg-slate-900/40 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
              Built for Teachers, Lecturers & Educational Institutions
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">98.4%</div>
                <div className="text-xs text-slate-400 mt-1">OCR Hand-written Accuracy</div>
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">12 Weeks</div>
                <div className="text-xs text-slate-400 mt-1">Structured per Term</div>
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">1-Click</div>
                <div className="text-xs text-slate-400 mt-1">DOCX & PDF Export</div>
              </div>
              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</div>
                <div className="text-xs text-slate-400 mt-1">Teacher Control & Auth</div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW SECTION (Inspired by "How our platform makes your workflow easier" in Nicepay reference) */}
        <section id="workflow" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Our Publishing Workflow</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How Textbook Studio makes your publishing <span className="text-purple-400">easier</span>
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Transform rough notes into complete, formatted educational textbooks through four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    activeStep === idx
                      ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-purple-500/60 shadow-xl shadow-purple-900/20 ring-1 ring-purple-500/40'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold text-slate-500">{item.step}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-slate-700">
                        {item.tag}
                      </span>
                    </div>

                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg mb-4`}>
                      <IconComp className="w-6 h-6" />
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 leading-snug">{item.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-purple-400">
                    <span>Explore Step</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FEATURES GRID SECTION */}
        <section id="features" className="py-20 border-t border-slate-800/80 bg-slate-950/60 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Core Capabilities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything you need to publish school textbooks
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Built with security, pedagogical accuracy, and print standards at its core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Multimodal OCR Vision</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Accepts camera snapshots, PDFs, and handwritten notes. Extracts equations, diagrams, and topic headers seamlessly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Curriculum AI Structuring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organizes raw material into structured weekly lesson plans, learning objectives, and end-of-week practice questions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Human-in-the-Loop Review</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Never lose control. Edit AI-generated text, adjust difficulty levels, and refine weekly content before finalizing.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                <Book className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Auto Subject Glossary</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically identifies key terms and definitions across all weeks to generate a complete end-of-book glossary.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">DOCX & PDF Print Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Outputs clean Word documents formatted with cover pages, table of contents, headers, footers, and page breaks.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Firebase Auth & Firestore Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your textbook projects and teacher files are isolated and stored securely under your account with Firestore database rules.
              </p>
            </div>
          </div>
        </section>

        {/* CTA BANNER (Matching bottom banner style) */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-3xl p-8 sm:p-12 border border-indigo-500/40 shadow-2xl relative overflow-hidden text-center space-y-6">
            
            {/* Backdrop glow */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl" />
            <div className="absolute -left-10 -top-10 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md inline-block">
                Start Publishing Free Today
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready to transform your teaching notes into published textbooks?
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 max-w-lg mx-auto leading-relaxed">
                Join educators using Textbook Studio to build curriculum-compliant textbooks and save hundreds of hours per term.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onGetStarted}
                  id="cta-get-started-btn"
                  className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>Launch Studio App</span>
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                </button>
                <button
                  onClick={onOpenAuth}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-950/80 hover:bg-indigo-900 text-white font-semibold text-sm rounded-2xl border border-indigo-400/40 transition-all"
                >
                  Sign In / Create Account
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
