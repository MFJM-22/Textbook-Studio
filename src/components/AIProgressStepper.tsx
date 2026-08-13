import React from 'react';
import { Check, Loader2, Sparkles, Cpu } from 'lucide-react';

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
    <div className={`glass-panel bg-[#0d1322]/95 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6 text-slate-100 ${className}`}>
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

        <div className="text-right flex items-center gap-3">
          <div>
            <span className="text-xl font-bold font-mono text-indigo-400">
              {Math.min(100, Math.max(0, Math.round(progressPercentage)))}%
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Progress
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(99,102,241,0.6)]"
            style={{ width: `${Math.min(100, Math.max(4, progressPercentage))}%` }}
          />
        </div>
        {statusMessage && (
          <p className="text-xs text-indigo-300 font-medium flex items-center gap-1.5 pt-0.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
            <span>{statusMessage}</span>
          </p>
        )}
      </div>

      {/* Horizontal Stepper Pattern */}
      <div className="relative pt-2 pb-1">
        {/* Background Connecting Line */}
        <div className="hidden sm:block absolute top-[22px] left-[6%] right-[6%] h-[2px] bg-slate-800 -z-0" />
        <div
          className="hidden sm:block absolute top-[22px] left-[6%] h-[2px] bg-indigo-500 transition-all duration-500 -z-0"
          style={{
            width: `${
              steps.length > 1
                ? Math.min(88, Math.max(0, (currentStepIndex / (steps.length - 1)) * 88))
                : 0
            }%`,
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className="flex sm:flex-col items-center text-left sm:text-center gap-3 sm:gap-2 group"
              >
                {/* Step Circle Bubble */}
                <div className="relative flex items-center justify-center shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCompleted
                        ? 'bg-indigo-600 text-white border-2 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                        : isActive
                        ? 'bg-slate-950 text-indigo-300 border-2 border-indigo-500 ring-4 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.6)]'
                        : 'bg-slate-900 text-slate-500 border-2 border-slate-700/80'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : isActive ? (
                      <span className="font-extrabold text-sm text-indigo-300">{idx + 1}</span>
                    ) : (
                      <span className="font-semibold text-slate-400">{idx + 1}</span>
                    )}
                  </div>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full animate-ping" />
                  )}
                </div>

                {/* Step Labels */}
                <div className="min-w-0 flex-1 sm:w-full">
                  <span
                    className={`text-[9px] font-extrabold uppercase tracking-widest block mb-0.5 ${
                      isCompleted
                        ? 'text-indigo-400'
                        : isActive
                        ? 'text-indigo-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {isCompleted ? 'COMPLETE' : isActive ? 'ACTIVE' : 'PENDING'}
                  </span>
                  <h4
                    className={`text-xs font-bold leading-snug truncate ${
                      isCompleted
                        ? 'text-white'
                        : isActive
                        ? 'text-indigo-200'
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
    </div>
  );
};
