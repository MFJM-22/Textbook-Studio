import React from 'react';
import { BookOpen, Shield, Heart, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onGetStarted: () => void;
  onOpenAuth: () => void;
  onNavigateToSection?: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onGetStarted, onOpenAuth }) => {
  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-600 pt-12 pb-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-200/80">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/15">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Textbook Studio
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    AI v2.0
                  </span>
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Empowering teachers, lecturers, and educational publishers to turn handwritten lesson notes and raw curricula into structured, print-ready textbooks in minutes.
            </p>

            <div className="flex items-center gap-2.5 pt-1 text-xs text-slate-600 flex-wrap">
              <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full text-emerald-700 font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-600" /> Firebase Firestore Secured
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full text-indigo-700 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Gemini AI Powered
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Product Features</h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">OCR Vision Scan</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">AI Curriculum Generator</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">Human Review Gate</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">Auto Glossary Builder</a></li>
              <li><a href="#features" className="hover:text-indigo-600 transition-colors">DOCX & PDF Publishing</a></li>
            </ul>
          </div>

          {/* Workflow */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Publishing Pipeline</h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li><a href="#workflow" className="hover:text-indigo-600 transition-colors">1. Upload Teacher Notes</a></li>
              <li><a href="#workflow" className="hover:text-indigo-600 transition-colors">2. Run OCR & AI Extract</a></li>
              <li><a href="#workflow" className="hover:text-indigo-600 transition-colors">3. Review Weekly Modules</a></li>
              <li><a href="#workflow" className="hover:text-indigo-600 transition-colors">4. Export for Print & Web</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Textbook Studio AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-slate-500">
              Made for Teachers & Educators <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20 inline" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
