import React, { useRef, useEffect, useState } from 'react';
import { Send, Square, Sparkles, HelpCircle, Layers, Code2, Bug, Lightbulb, Bot } from 'lucide-react';
import { Message, WorkflowStep } from '../types.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  onOpenArtifact: (code: string, language: string, filename: string) => void;
  onRunInSandbox: (code: string, language: string) => void;
  onExplainCode: (code: string, language: string) => void;
  activeWorkflowStep: WorkflowStep;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isStreaming,
  onStopStreaming,
  onOpenArtifact,
  onRunInSandbox,
  onExplainCode,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when new messages arrive or stream updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const starterExamples = [
    {
      title: 'Full-Stack REST API',
      category: 'Backend Architecture',
      prompt: 'I want to build a complete REST API for a task management application with user authentication, input validation, and SQLite persistence. What should we clarify first?',
    },
    {
      title: 'Debug Async State Bug',
      category: 'Frontend React',
      prompt: "I have a React component where state updates seem one step behind when submitting a form after selecting an item. Can you help me find and fix this error?",
    },
    {
      title: 'Explain LRU Cache Logic',
      category: 'Data Structures & CS',
      prompt: 'Can you explain the logical thought process behind an LRU (Least Recently Used) cache and then help me implement it in TypeScript?',
    },
    {
      title: 'Automated CSV Processing',
      category: 'Data Pipeline',
      prompt: 'Write a Python script that ingests multiple CSV files, validates required columns, aggregates metrics, and outputs a clean JSON report.',
    },
  ];

  const quickNudges = [
    { label: 'Step 1: Clarify', icon: HelpCircle, text: 'Could you review this request and ask any essential clarifying questions regarding edge cases, environment, or requirements?' },
    { label: 'Step 2: Overview', icon: Layers, text: 'Please outline the Step 2 High-Level Solution Overview (architecture, prerequisites, and how it works) before writing code.' },
    { label: 'Step 3: Implement', icon: Code2, text: 'The plan is solid. Please proceed to Step 3: provide the complete, production-ready code with inline comments and execution instructions.' },
    { label: 'Debug Error', icon: Bug, text: 'I encountered an error running the code. Here are the symptoms and logs:' },
    { label: 'Explain Logic', icon: Lightbulb, text: 'Could you walk me through the step-by-step logic of this function in plain language?' },
  ];

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-100">
      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty State: Greetings & Capabilities introduction as required by prompt */
          <div className="max-w-2xl mx-auto py-8 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sky-950/60 border border-sky-800/40 text-sky-400 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Programming Partner</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                How can we build your software today?
              </h1>
              <p className="text-sm md:text-base text-neutral-400 leading-relaxed">
                I am your expert, patient, and encouraging programming partner. I help you build complete
                production-ready applications, understand algorithmic logic, and debug runtime errors through
                a disciplined 3-step workflow:
              </p>
            </div>

            {/* 3-Step Methodology Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-neutral-500">01</span>
                  <span>Clarification</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-normal">
                  Gather requirements, constraints, environment, and edge cases.
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-neutral-500">02</span>
                  <span>Solution Overview</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-normal">
                  High-level architectural blueprint, prerequisites, and tradeoffs.
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-neutral-500">03</span>
                  <span>Complete Code</span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-normal">
                  Functional code with inline comments and actionable run instructions.
                </p>
              </div>
            </div>

            {/* Practical Starter Examples */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Practical Starters
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {starterExamples.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.prompt)}
                    className="p-3 text-left rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-neutral-200 group-hover:text-sky-300 transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex gap-3 max-w-3xl ${
                  isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-sky-400" />
                  </div>
                )}

                <div
                  className={`flex flex-col rounded-xl px-4 py-3 max-w-2xl text-sm ${
                    isUser
                      ? 'bg-neutral-800 border border-neutral-700/80 text-neutral-100'
                      : 'bg-neutral-900/90 border border-neutral-800/80 text-neutral-200'
                  }`}
                >
                  {/* Step Banner on Model Messages */}
                  {!isUser && message.workflowStep && message.workflowStep !== 'general' && (
                    <div className="mb-2 pb-1.5 border-b border-neutral-800/80 flex items-center gap-2 text-[11px] text-neutral-400">
                      <span className="font-semibold text-sky-400 uppercase tracking-wider">
                        {message.workflowStep === 'clarification' && 'Step 1: Requirement Gathering'}
                        {message.workflowStep === 'overview' && 'Step 2: Solution Overview'}
                        {message.workflowStep === 'implementation' && 'Step 3: Implementation'}
                      </span>
                      <span>·</span>
                      <span className="text-neutral-500">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {/* Message Content */}
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  ) : (
                    <MarkdownRenderer
                      content={message.content}
                      onOpenArtifact={onOpenArtifact}
                      onRunInSandbox={onRunInSandbox}
                      onExplainCode={onExplainCode}
                    />
                  )}

                  {message.isStreaming && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-sky-400 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                      <span>DevPartner thinking & formulating solution...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="border-t border-neutral-800 bg-neutral-950 p-3 md:p-4 space-y-2">
        {/* Quick Workflow Nudges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {quickNudges.map((nudge, idx) => {
            const Icon = nudge.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setInputText(nudge.text)}
                disabled={isStreaming}
                className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap text-[11px] shrink-0 disabled:opacity-50"
              >
                <Icon className="w-3 h-3 text-sky-400" />
                <span>{nudge.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <div className="relative flex-1 rounded-lg border border-neutral-800 bg-neutral-900 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a programming question, request a solution, or paste code to debug..."
              rows={2}
              className="w-full bg-transparent px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none font-sans"
            />
          </div>

          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="h-10 px-3 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-200 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              title="Stop generating"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                inputText.trim()
                  ? 'bg-sky-500 hover:bg-sky-400 text-neutral-950 shadow-sm active:scale-95'
                  : 'bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-800'
              }`}
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>

        <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
          <span>
            Follows 3-step workflow: <strong className="text-neutral-400 font-normal">Clarify → Overview → Implementation</strong>
          </span>
          <span className="hidden sm:inline">Press Enter to send, Shift + Enter for newline</span>
        </div>
      </div>
    </div>
  );
};
