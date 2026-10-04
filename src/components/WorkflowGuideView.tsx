import React from 'react';
import { HelpCircle, Layers, Code, CheckCircle, ArrowRight, ShieldCheck, BookOpen, Terminal } from 'lucide-react';
import { WorkflowStep } from '../types.ts';

interface WorkflowGuideViewProps {
  onStartStep: (prompt: string, step: WorkflowStep) => void;
}

export const WorkflowGuideView: React.FC<WorkflowGuideViewProps> = ({ onStartStep }) => {
  const steps = [
    {
      number: '01',
      step: 'clarification' as WorkflowStep,
      title: 'Requirement Gathering & Clarification',
      icon: HelpCircle,
      tag: 'Step 1: Alignment & Scope',
      description:
        'Before writing any code, DevPartner actively identifies ambiguities and asks concise clarifying questions regarding runtime targets, constraints, data schemas, and edge cases.',
      rules: [
        'Clarifies target language version & runtime environment',
        'Uncovers potential edge cases (empty inputs, concurrency, network failures)',
        'Aligns on preferred frameworks or dependencies before writing code',
      ],
      prompt:
        'I want to build a real-time collaborative poll system. Can you ask me the necessary clarifying questions under Step 1 before we design or write code?',
    },
    {
      number: '02',
      step: 'overview' as WorkflowStep,
      title: 'High-Level Solution Overview',
      icon: Layers,
      tag: 'Step 2: Architecture & Blueprint',
      description:
        'Presents a high-level architectural overview before coding. Explains what the code does, how it works, prerequisite tools, and notable engineering trade-offs.',
      rules: [
        'Outlines data structures, algorithmic complexity, and component flow',
        'Identifies prerequisites, environment configurations, and external APIs',
        'Analyzes limitations, memory footprints, and security considerations',
      ],
      prompt:
        'Please provide the Step 2 High-Level Solution Overview for an in-memory Pub/Sub message broker in TypeScript before writing code.',
    },
    {
      number: '03',
      step: 'implementation' as WorkflowStep,
      title: 'Code & Implementation',
      icon: Code,
      tag: 'Step 3: Complete, Production-Ready Code',
      description:
        'Delivers complete, fully functional code without placeholder comments (e.g., no `// TODO: implement later`). Includes thorough inline comments, setup, build, and run instructions.',
      rules: [
        'Delivers complete and functional code ready to run directly',
        'Provides comprehensive inline comments explaining logic and parameters',
        'Gives step-by-step instructions on installation, execution, and verification',
      ],
      prompt:
        'Please provide the complete Step 3 code and implementation for a rate-limiting middleware in Express with tests and run instructions.',
    },
  ];

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-y-auto p-4 md:p-8 space-y-8">
      {/* Hero Section */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sky-950/60 border border-sky-800/40 text-sky-400 text-xs font-medium">
          <BookOpen className="w-3.5 h-3.5" />
          <span>DevPartner Execution Methodology</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          The 3-Step Engineering Workflow
        </h1>
        <p className="text-sm md:text-base text-neutral-400 leading-relaxed">
          Every coding consultation adheres strictly to this systematic 3-step workflow to guarantee
          production quality, avoid false assumptions, and ensure complete educational clarity.
        </p>
      </div>

      {/* Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.number}
              className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 flex flex-col justify-between space-y-4 hover:border-neutral-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-sky-400 font-semibold px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/60 tabular-nums">
                    Step {s.number}
                  </span>
                  <Icon className="w-4 h-4 text-neutral-400" />
                </div>

                <h2 className="text-base font-semibold text-white leading-snug">{s.title}</h2>
                <p className="text-xs text-neutral-400 leading-relaxed">{s.description}</p>

                <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                  <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
                    Core Mandates
                  </span>
                  <ul className="space-y-1.5 text-xs text-neutral-400">
                    {s.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                onClick={() => onStartStep(s.prompt, s.step)}
                className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Try Example Prompt</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Core Principles Banner */}
      <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Communication Guarantees & Constraints</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-neutral-400">
          <div>
            <div className="font-semibold text-neutral-200 mb-1">Zero Placeholder Code</div>
            <p className="text-[11px] leading-relaxed">
              Never outputs `// TODO` or skipped sections unless explicitly requested. Delivers complete implementations.
            </p>
          </div>
          <div>
            <div className="font-semibold text-neutral-200 mb-1">Strict Domain Focus</div>
            <p className="text-[11px] leading-relaxed">
              Exclusively dedicated to computer science, software engineering, and debugging. Redirects off-topic queries.
            </p>
          </div>
          <div>
            <div className="font-semibold text-neutral-200 mb-1">Context Retention</div>
            <p className="text-[11px] leading-relaxed">
              Maintains full conversation state and history, building iteratively on previous architectural decisions.
            </p>
          </div>
          <div>
            <div className="font-semibold text-neutral-200 mb-1">Actionable Run Steps</div>
            <p className="text-[11px] leading-relaxed">
              Includes exact commands, directory structure, and execution steps to run without friction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
