import React, { useState } from 'react';
import { Bug, Play, CheckCircle2, ArrowRight, RefreshCw, FileCode } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { CodeArtifact } from '../types.ts';

interface DiagnosticLabProps {
  currentArtifacts: CodeArtifact[];
  onApplyFixedCode: (filename: string, language: string, fixedCode: string) => void;
  onSendToChat: (prompt: string) => void;
}

export const DiagnosticLab: React.FC<DiagnosticLabProps> = ({
  currentArtifacts,
  onApplyFixedCode,
  onSendToChat,
}) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>(
    currentArtifacts[0]?.id || ''
  );
  const [code, setCode] = useState<string>(currentArtifacts[0]?.code || '');
  const [language, setLanguage] = useState<string>(currentArtifacts[0]?.language || 'typescript');
  const [errorLog, setErrorLog] = useState<string>('');
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  // Sync when selecting existing artifact
  const handleSelectArtifact = (id: string) => {
    setSelectedArtifactId(id);
    const art = currentArtifacts.find((a) => a.id === id);
    if (art) {
      setCode(art.code);
      setLanguage(art.language);
    }
  };

  const handleRunDiagnostic = async () => {
    if (!code.trim() && !errorLog.trim()) return;
    setIsDiagnosing(true);
    setDiagnosticResult(null);

    try {
      const res = await fetch('/api/code/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, errorLog, language }),
      });

      const data = await res.json();
      if (data.result) {
        setDiagnosticResult(data.result);
      } else {
        setDiagnosticResult(data.error || 'Failed to diagnose the issue.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setDiagnosticResult(`Error during diagnostic: ${error.message}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Diagnostic Lab Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-wider">
            <Bug className="w-4 h-4" />
            <span>Interactive Diagnostic Lab</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Root-Cause Diagnosis & Guided Debugging
          </h1>
          <p className="text-xs text-neutral-400">
            Provide the problematic code and runtime error symptoms to receive an educational root-cause explanation and complete functional fix.
          </p>
        </div>

        {/* Existing file quick loader */}
        {currentArtifacts.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-neutral-400">Load from file:</span>
            <select
              value={selectedArtifactId}
              onChange={(e) => handleSelectArtifact(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
            >
              {currentArtifacts.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.filename} ({art.language})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Input Grid: Code vs Error */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Code Box */}
        <div className="flex flex-col rounded-lg border border-neutral-800 bg-neutral-900/60 overflow-hidden">
          <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              Source Code
            </span>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="language"
              className="w-24 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-[11px] text-neutral-300 font-mono uppercase"
            />
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste the snippet or function that is failing..."
            rows={12}
            className="w-full flex-1 p-3 bg-neutral-950/80 font-mono text-xs text-neutral-200 resize-none focus:outline-none leading-relaxed"
          />
        </div>

        {/* Error Symptoms / Stacktrace Box */}
        <div className="flex flex-col rounded-lg border border-neutral-800 bg-neutral-900/60 overflow-hidden">
          <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-red-300 flex items-center gap-1.5">
              <Bug className="w-3.5 h-3.5 text-red-400" />
              Error Message, Stack Trace, or Behavior
            </span>
          </div>
          <textarea
            value={errorLog}
            onChange={(e) => setErrorLog(e.target.value)}
            placeholder="Paste console error, TypeError, exception stack trace, or describe unexpected behavior..."
            rows={12}
            className="w-full flex-1 p-3 bg-neutral-950/80 font-mono text-xs text-red-300/90 resize-none focus:outline-none leading-relaxed"
          />
        </div>
      </div>

      {/* Diagnose Button */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-neutral-500">
          Identifies root cause, edge conditions, and outputs full replacement code.
        </span>

        <button
          onClick={handleRunDiagnostic}
          disabled={isDiagnosing || (!code.trim() && !errorLog.trim())}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-500 font-semibold rounded-lg text-xs transition-all flex items-center gap-2 shadow-sm disabled:cursor-not-allowed"
        >
          {isDiagnosing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Failure Root Cause...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Diagnose & Formulate Solution</span>
            </>
          )}
        </button>
      </div>

      {/* Diagnostic Result View */}
      {diagnosticResult && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-white text-sm">Diagnosis & Corrected Solution</h3>
            </div>

            <button
              onClick={() => {
                onSendToChat(
                  `I ran the diagnostic lab on this code and error:\n\`\`\`${language}\n${code}\n\`\`\`\nError:\n${errorLog}\n\nPlease help me integrate and test this fix further.`
                );
              }}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
            >
              <span>Continue discussion in Chat</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="prose-code-partner">
            <MarkdownRenderer
              content={diagnosticResult}
              onOpenArtifact={(fixedCode, lang, filename) => {
                onApplyFixedCode(filename || 'fixed_code.ts', lang, fixedCode);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
