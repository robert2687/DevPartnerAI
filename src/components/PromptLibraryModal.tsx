import React, { useState } from 'react';
import { BookOpen, X, ArrowUpRight, Search, Code, Cpu, Database, ShieldAlert, Sparkles } from 'lucide-react';
import { StarterPrompt } from '../types.ts';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const library: Array<StarterPrompt & { category: string; description: string }> = [
    {
      id: 'fullstack-auth',
      title: 'Full-Stack Auth API',
      category: 'backend',
      tag: 'Node / Express / JWT',
      step: 'clarification',
      description: 'Production-ready REST API with password hashing, JWT cookies, rate limiting, and input sanitization.',
      prompt: 'I want to build a complete backend authentication API in Node.js and Express with JWT, bcrypt password hashing, and clean error middleware. Can we begin with Step 1 and clarify the database and constraints?',
    },
    {
      id: 'algo-lru',
      title: 'LRU Cache with Doubly Linked List',
      category: 'algorithms',
      tag: 'TypeScript / Data Structures',
      step: 'overview',
      description: 'O(1) get and put operations combining hash map indexing with an internal doubly linked list.',
      prompt: 'Can you walk me through the logic and implementation of an LRU (Least Recently Used) cache in TypeScript with O(1) operations? Please start with the Step 2 Solution Overview explaining the pointers and data structures.',
    },
    {
      id: 'react-infinite-scroll',
      title: 'Virtualized Infinite Scroll Hook',
      category: 'frontend',
      tag: 'React / Performance',
      step: 'clarification',
      description: 'Clean custom hook using IntersectionObserver to fetch pages, handle loading states, and avoid duplicate triggers.',
      prompt: 'I need a custom React hook for infinite scrolling with an IntersectionObserver. Can you ask me any clarifying questions regarding pagination styles, throttling, and edge cases?',
    },
    {
      id: 'python-etl',
      title: 'CSV Data Ingestion & Sanitizer',
      category: 'data',
      tag: 'Python / ETL',
      step: 'overview',
      description: 'Robust batch processor that handles corrupt rows, types casting, missing values, and produces a summary.',
      prompt: 'Write a Python data ingestion script that reads dirty CSV records, validates column schemas, coerces dates and numbers, and writes valid items to SQLite. Please provide the Step 2 High-Level Architecture first.',
    },
    {
      id: 'sql-analytics',
      title: 'Window Functions & Retention Queries',
      category: 'database',
      tag: 'PostgreSQL / Analytics',
      step: 'implementation',
      description: 'Compute 7-day and 30-day user cohort retention rates using SQL window functions.',
      prompt: 'Can you provide the complete SQL queries with thorough inline comments to calculate user cohort retention over 30 days from an events table? Include schema setup instructions.',
    },
    {
      id: 'debug-memory-leak',
      title: 'Node.js Event Listener Leak',
      category: 'debugging',
      tag: 'Node.js / Memory',
      step: 'clarification',
      description: 'Diagnose and fix MaxListenersExceededWarning caused by unbounded event subscription closures.',
      prompt: 'My Node.js WebSocket gateway server is throwing MaxListenersExceededWarning and memory usage steadily climbs. How can we methodically diagnose and fix this leak?',
    },
  ];

  const categories = [
    { id: 'all', label: 'All Patterns' },
    { id: 'backend', label: 'Backend & APIs' },
    { id: 'frontend', label: 'Frontend & UI' },
    { id: 'algorithms', label: 'Algorithms & CS' },
    { id: 'data', label: 'Data Pipelines' },
    { id: 'debugging', label: 'Debugging Lab' },
  ];

  const filtered = library.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[85vh] bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Prompt & Pattern Library</h2>
              <p className="text-[11px] text-neutral-400">
                Curated architectural templates structured for the 3-step workflow
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/60 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates, languages, or algorithms..."
              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap text-xs font-medium ${
                  selectedCategory === cat.id
                    ? 'bg-neutral-800 text-sky-400 border border-neutral-700'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectPrompt(item.prompt);
                onClose();
              }}
              className="group p-4 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-sky-500/50 hover:bg-neutral-900/60 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white group-hover:text-sky-300 transition-colors">
                    {item.title}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-sky-400 transition-colors" />
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-neutral-850 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                <span>{item.tag}</span>
                <span className="uppercase text-sky-400/90 font-sans font-medium">
                  {item.step}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
