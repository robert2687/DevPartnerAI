import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Clock, Lightbulb, RefreshCw, Send } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';

interface ExplanationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  codeSnippet: string;
  language: string;
  onAskFollowup: (question: string) => void;
}

export const ExplanationDrawer: React.FC<ExplanationDrawerProps> = ({
  isOpen,
  onClose,
  codeSnippet,
  language,
  onAskFollowup,
}) => {
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [followupText, setFollowupText] = useState<string>('');

  const fetchExplanation = async () => {
    if (!codeSnippet.trim()) return;
    setIsLoading(true);
    setExplanation('');

    try {
      const res = await fetch('/api/code/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeSnippet, language }),
      });

      const data = await res.json();
      if (data.explanation) {
        setExplanation(data.explanation);
      } else {
        setExplanation(data.error || 'Failed to generate explanation.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setExplanation(`Error fetching explanation: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && codeSnippet) {
      fetchExplanation();
    }
  }, [isOpen, codeSnippet]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-neutral-900 border-l border-neutral-800 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Educational Logic Breakdown</h2>
              <p className="text-[11px] text-neutral-400">
                Step-by-step algorithmic guidance & design principles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchExplanation}
              disabled={isLoading}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
              title="Regenerate explanation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code Preview Pill */}
        <div className="px-4 py-2.5 bg-neutral-950 border-b border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-medium mb-1 flex items-center justify-between">
            <span>Target Code Snippet:</span>
            <span className="font-mono text-neutral-500 uppercase text-[10px]">{language}</span>
          </div>
          <pre className="font-mono text-xs text-neutral-300 max-h-24 overflow-y-auto bg-neutral-900/80 p-2 rounded border border-neutral-800">
            <code>{codeSnippet.slice(0, 400)}{codeSnippet.length > 400 ? '...' : ''}</code>
          </pre>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-neutral-200">Analyzing Code Logic...</p>
                <p className="text-xs text-neutral-500">
                  Formulating step-by-step educational walkthrough and edge cases
                </p>
              </div>
            </div>
          ) : explanation ? (
            <div className="prose-code-partner">
              <MarkdownRenderer content={explanation} />
            </div>
          ) : null}
        </div>

        {/* Followup Question Form */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!followupText.trim()) return;
              onAskFollowup(
                `Regarding this code:\n\`\`\`${language}\n${codeSnippet}\n\`\`\`\n\nQuestion: ${followupText}`
              );
              setFollowupText('');
              onClose();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={followupText}
              onChange={(e) => setFollowupText(e.target.value)}
              placeholder="Ask a question about this logic (e.g., How to handle edge cases?)..."
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              disabled={!followupText.trim()}
              className="px-3 py-2 bg-sky-500 hover:bg-sky-400 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-500 font-medium rounded text-xs transition-colors flex items-center gap-1.5"
            >
              <span>Ask</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
