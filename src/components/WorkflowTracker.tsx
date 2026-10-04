import React from 'react';
import { HelpCircle, Layers, Code, ArrowRight } from 'lucide-react';
import { WorkflowStep } from '../types.ts';

interface WorkflowTrackerProps {
  currentStep: WorkflowStep;
  onSelectPromptNudge: (prompt: string) => void;
  isStreaming: boolean;
}

export const WorkflowTracker: React.FC<WorkflowTrackerProps> = ({
  currentStep,
  onSelectPromptNudge,
  isStreaming,
}) => {
  const steps = [
    {
      id: 'clarification' as WorkflowStep,
      number: '01',
      title: 'Clarification',
      desc: 'Requirements & Scope',
      icon: HelpCircle,
      nudge: 'Could you ask me any necessary clarifying questions regarding requirements, environment, or edge cases?',
    },
    {
      id: 'overview' as WorkflowStep,
      number: '02',
      title: 'Solution Overview',
      desc: 'Architecture & Tradeoffs',
      icon: Layers,
      nudge: 'The requirements are clear. Please provide the Step 2 High-Level Solution Overview detailing architecture, prerequisites, and how it works.',
    },
    {
      id: 'implementation' as WorkflowStep,
      number: '03',
      title: 'Implementation',
      desc: 'Complete Code & Steps',
      icon: Code,
      nudge: 'The plan looks great! Please proceed to Step 3: deliver the complete, production-ready code with inline comments and execution instructions.',
    },
  ];

  const getStepState = (stepId: WorkflowStep) => {
    if (currentStep === stepId) return 'active';
    if (currentStep === 'implementation') {
      return stepId !== 'implementation' ? 'completed' : 'active';
    }
    if (currentStep === 'overview' && stepId === 'clarification') {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="bg-neutral-900/80 border-b border-neutral-800/80 px-4 py-2.5 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Step Progression Bar */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0">
          {steps.map((step, idx) => {
            const state = getStepState(step.id);
            const Icon = step.icon;

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-2 text-xs transition-colors shrink-0 ${
                    state === 'active'
                      ? 'text-sky-400 font-medium'
                      : state === 'completed'
                      ? 'text-neutral-300'
                      : 'text-neutral-500'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono tabular-nums border ${
                      state === 'active'
                        ? 'border-sky-500/50 bg-sky-950 text-sky-300'
                        : state === 'completed'
                        ? 'border-emerald-600/40 bg-emerald-950/40 text-emerald-400'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-500'
                    }`}
                  >
                    {step.number}
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span className="font-medium flex items-center gap-1">
                      <Icon className="w-3 h-3" />
                      {step.title}
                    </span>
                    <span className="text-[10px] text-neutral-500 hidden md:inline">
                      {step.desc}
                    </span>
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <span className="text-neutral-700 text-xs hidden sm:inline" aria-hidden="true">
                    →
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Workflow Progression Quick-Action Nudges */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {currentStep === 'clarification' && (
            <button
              onClick={() => onSelectPromptNudge(steps[1].nudge)}
              disabled={isStreaming}
              className="text-[11px] text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded px-2.5 py-1 flex items-center gap-1 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <span>Next: High-Level Overview</span>
              <ArrowRight className="w-3 h-3 text-sky-400" />
            </button>
          )}

          {currentStep === 'overview' && (
            <button
              onClick={() => onSelectPromptNudge(steps[2].nudge)}
              disabled={isStreaming}
              className="text-[11px] text-sky-300 hover:text-white bg-sky-950/60 hover:bg-sky-900/60 border border-sky-700/60 rounded px-2.5 py-1 flex items-center gap-1 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <span>Next: Complete Implementation</span>
              <ArrowRight className="w-3 h-3 text-sky-400" />
            </button>
          )}

          {currentStep === 'implementation' && (
            <button
              onClick={() =>
                onSelectPromptNudge(
                  'Please explain the key logical components of this implementation step-by-step and test for potential edge cases.'
                )
              }
              disabled={isStreaming}
              className="text-[11px] text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded px-2.5 py-1 flex items-center gap-1 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <span>Explain Logic & Edge Cases</span>
              <ArrowRight className="w-3 h-3 text-sky-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
