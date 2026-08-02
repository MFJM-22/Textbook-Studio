import React from 'react';
import { BookOpen, Shield, Heart, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onGetStarted: () => void;
  onOpenAuth: () => void;
  onNavigateToSection?: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onGetStarted, onOpenAuth }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Textbook Studio
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                    AI v2.0
                  </span>
                </span>
                <p className="text-xs text-slate-400">Automated Teacher Notes to Published Textbook</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Empowering teachers, lecturers, and educational publishers to turn handwritten lesson notes and raw curricula into structured, print-ready textbooks in minutes.
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-emerald-400">
                <Shield className="w-3.5 h-3.5" /> Firebase Firestore Secured
              </span>
              <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-blue-400">
                <Sparkles className="w-3.5 h-3.5" /> Gemini AI Powered
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Product Features</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">OCR Vision Scan</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">AI Curriculum Generator</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Human Review Gate</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Auto Glossary Builder</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">DOCX & PDF Publishing</a></li>
            </ul>
          </div>

          {/* Workflow */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Publishing Pipeline</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#workflow" className="hover:text-white transition-colors">1. Upload Teacher Notes</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">2. Run OCR & AI Extract</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">3. Review Weekly Modules</a></li>
              <li><a href="#workflow" className="hover:text-white transition-colors">4. Export for Print & Web</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Textbook Studio AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-slate-400">
              Made for Teachers & Educators <Heart className="w-3.5 h-3.5 text-red-400 inline" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
