import React from 'react';
import { BookOpen, Shield, Heart, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onGetStarted: () => void;
  onOpenAuth: () => void;
  onNavigateToSection?: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="bg-[#07090e] border-t border-white/10 text-slate-400 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-white font-display tracking-tight flex items-center gap-2">
                  Textbook Studio
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full glass-pill border border-indigo-500/30 text-indigo-300">
                    AI v2.0
                  </span>
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Empowering teachers, lecturers, and educational publishers to turn handwritten lesson notes and raw curricula into structured, print-ready textbooks in minutes.
            </p>

            <div className="flex items-center gap-2.5 pt-1 text-xs text-slate-300 flex-wrap">
              <span className="flex items-center gap-1.5 glass-panel px-3 py-1 rounded-full text-indigo-300 font-medium border border-white/10">
                <Shield className="w-3.5 h-3.5 text-indigo-400" /> Firebase Firestore Secured
              </span>
              <span className="flex items-center gap-1.5 glass-panel px-3 py-1 rounded-full text-indigo-300 font-medium border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Gemini AI Powered
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Product Capabilities</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#features" className="hover:text-indigo-400 transition-colors">Multimodal OCR Vision</a></li>
              <li><a href="#features" className="hover:text-indigo-400 transition-colors">Curriculum Structuring</a></li>
              <li><a href="#features" className="hover:text-indigo-400 transition-colors">Human Review Gate</a></li>
              <li><a href="#features" className="hover:text-indigo-400 transition-colors">Auto Glossary Builder</a></li>
              <li><a href="#features" className="hover:text-indigo-400 transition-colors">DOCX & PDF Publishing</a></li>
            </ul>
          </div>

          {/* Workflow */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Publishing Pipeline</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li><a href="#workflow" className="hover:text-indigo-400 transition-colors">1. Upload Teacher Notes</a></li>
              <li><a href="#workflow" className="hover:text-indigo-400 transition-colors">2. Multimodal OCR Extract</a></li>
              <li><a href="#workflow" className="hover:text-indigo-400 transition-colors">3. Review Weekly Curriculum</a></li>
              <li><a href="#workflow" className="hover:text-indigo-400 transition-colors">4. DOCX & PDF Export</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Textbook Studio AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              Made for Teachers & Educators <Heart className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20 inline" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

