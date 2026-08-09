import React from 'react';
import { Check, Loader2, Sparkles, Cpu, ShieldCheck } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  description: string;
}

interface AIProgressStepperProps {
  title: string;
  subtitle?: string;
  steps: ProgressStep[];
  currentStepIndex: number;
  progressPercentage: number;
  statusMessage?: string;
  className?: string;
}

export const AIProgressStepper: React.FC<AIProgressStepperProps> = ({
  title,
  subtitle,
  steps,
  currentStepIndex,
  progressPercentage,
  statusMessage,
  className = '',
}) => {
  return (
    <div className={`glass-panel bg-[#0d1322]/90 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-slate-100 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.25)] shrink-0">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white font-display">{title}</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3 h-3" /> Gemini AI
              </span>
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xl font-bold font-mono text-indigo-400">
            {Math.min(100, Math.max(0, Math.round(progressPercentage)))}%
          </span>
          <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            Progress
          </span>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-3 bg-slate-900/90 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(99,102,241,0.6)]"
            style={{ width: `${Math.min(100, Math.max(5, progressPercentage))}%` }}
          />
        </div>
        {statusMessage && (
          <p className="text-xs text-indigo-300 font-medium flex items-center gap-1.5 pt-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
            <span>{statusMessage}</span>
          </p>
        )}
      </div>

      {/* Stepper Steps List */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          const isUpcoming = idx > currentStepIndex;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-2xl border transition-all flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 ${
                isCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isActive
                  ? 'bg-indigo-600/20 border-indigo-500/60 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/40 border-white/5 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between w-full sm:w-auto">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : isActive
                      ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.8)]'
                      : 'bg-slate-800 text-slate-500 border border-white/10'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : isActive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    idx + 1
                  )}
                </div>

                {isActive && (
                  <span className="sm:hidden text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    Active
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4
                  className={`text-xs font-bold truncate ${
                    isCompleted
                      ? 'text-emerald-300'
                      : isActive
                      ? 'text-white'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </h4>
                <p
                  className={`text-[10px] line-clamp-1 mt-0.5 ${
                    isActive ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
