import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, CheckCircle2, AlertTriangle, Clock, RefreshCw, Terminal, Eye } from 'lucide-react';
import { CodeArtifact, ExecutionLog, ExecutionResult } from '../types.ts';

interface LiveSandboxProps {
  artifact: CodeArtifact | null;
  onCodeChange?: (updatedCode: string) => void;
}

export const LiveSandbox: React.FC<LiveSandboxProps> = ({ artifact, onCodeChange }) => {
  const [activeTab, setActiveTab] = useState<'console' | 'preview'>('console');
  const [executionResult, setExecutionResult] = useState<ExecutionResult>({
    logs: [],
    status: 'idle',
    executionTimeMs: 0,
  });
  const [testInput, setTestInput] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isHtmlWeb =
    artifact?.language === 'html' ||
    artifact?.filename.endsWith('.html') ||
    (artifact?.code.includes('<!DOCTYPE') || artifact?.code.includes('<html'));

  useEffect(() => {
    if (isHtmlWeb) {
      setActiveTab('preview');
    } else {
      setActiveTab('console');
    }
  }, [artifact?.filename, isHtmlWeb]);

  // Execute JavaScript/TypeScript or test script
  const executeCode = () => {
    if (!artifact) return;

    setExecutionResult({
      logs: [],
      status: 'running',
      executionTimeMs: 0,
    });

    const logs: ExecutionLog[] = [];
    const startTime = performance.now();

    try {
      // Mock safe console
      const customConsole = {
        log: (...args: unknown[]) => {
          logs.push({
            id: `log-${Date.now()}-${Math.random()}`,
            type: 'log',
            content: args
              .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
              .join(' '),
            timestamp: Date.now(),
          });
        },
        info: (...args: unknown[]) => {
          logs.push({
            id: `log-${Date.now()}-${Math.random()}`,
            type: 'info',
            content: args
              .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
              .join(' '),
            timestamp: Date.now(),
          });
        },
        warn: (...args: unknown[]) => {
          logs.push({
            id: `log-${Date.now()}-${Math.random()}`,
            type: 'warn',
            content: args
              .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
              .join(' '),
            timestamp: Date.now(),
          });
        },
        error: (...args: unknown[]) => {
          logs.push({
            id: `log-${Date.now()}-${Math.random()}`,
            type: 'error',
            content: args
              .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
              .join(' '),
            timestamp: Date.now(),
          });
        },
      };

      // Strip basic typescript types if running as JS
      let runnableCode = artifact.code;
      // Remove basic type annotations: : string, : number, : boolean, interface Foo { ... }
      runnableCode = runnableCode.replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '');
      runnableCode = runnableCode.replace(/type\s+\w+\s*=[\s\S]*?;/g, '');

      // Evaluate safely inside sandbox function
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const runner = new Function('console', 'input', `
        try {
          ${runnableCode}
          ${testInput.trim() ? `\n// Optional Test Input Evaluation:\n${testInput}` : ''}
        } catch(e) {
          console.error(e.message || String(e));
          throw e;
        }
      `);

      runner(customConsole, testInput);

      const endTime = performance.now();
      const elapsed = Math.round((endTime - startTime) * 100) / 100;

      setExecutionResult({
        logs,
        status: 'success',
        executionTimeMs: elapsed,
      });
    } catch (err: unknown) {
      const error = err as Error;
      const endTime = performance.now();
      const elapsed = Math.round((endTime - startTime) * 100) / 100;

      setExecutionResult({
        logs,
        error: error.message || 'Execution error',
        status: 'error',
        executionTimeMs: elapsed,
      });
    }
  };

  // Update iframe preview for HTML
  useEffect(() => {
    if (activeTab === 'preview' && iframeRef.current && artifact) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(artifact.code);
        doc.close();
      }
    }
  }, [activeTab, artifact?.code]);

  if (!artifact) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500">
        <Terminal className="w-8 h-8 mb-2 stroke-1" />
        <p className="text-sm">Select or generate a code block to run in the Sandbox.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-200">
      {/* Sandbox Header / Controls */}
      <div className="px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-0.5 rounded bg-neutral-950 border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 font-medium ${
              activeTab === 'console'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Runtime Console</span>
          </button>

          {isHtmlWeb && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 font-medium ${
                activeTab === 'preview'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Visual Preview</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'console' && (
            <button
              onClick={executeCode}
              disabled={executionResult.status === 'running'}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-neutral-950 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Script</span>
            </button>
          )}

          {activeTab === 'preview' && (
            <button
              onClick={() => {
                if (iframeRef.current && artifact) {
                  const doc = iframeRef.current.contentDocument;
                  if (doc) {
                    doc.open();
                    doc.write(artifact.code);
                    doc.close();
                  }
                }
              }}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reload Frame</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'preview' ? (
          <div className="w-full h-full bg-white">
            <iframe
              ref={iframeRef}
              title="Interactive Live Sandbox"
              sandbox="allow-scripts allow-modals allow-forms"
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div className="h-full flex flex-col p-4 space-y-4 overflow-y-auto font-mono text-xs">
            {/* Quick Test Input Harness */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-medium font-sans">
                  Test Execution Harness / Custom Invocation:
                </span>
                <span className="text-[10px] text-neutral-500 font-sans">
                  Optional JavaScript call or assertion
                </span>
              </div>
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="e.g. console.log(solution([2, 7, 11, 15], 9));"
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-sky-500 text-xs"
              />
            </div>

            {/* Execution Status Bar */}
            <div className="flex items-center justify-between text-xs py-1 border-b border-neutral-800 text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-sans">Status:</span>
                {executionResult.status === 'idle' && <span>Ready to execute</span>}
                {executionResult.status === 'running' && (
                  <span className="text-sky-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Running...
                  </span>
                )}
                {executionResult.status === 'success' && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Execution Succeeded
                  </span>
                )}
                {executionResult.status === 'error' && (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Runtime Error
                  </span>
                )}
              </div>

              {executionResult.executionTimeMs > 0 && (
                <div className="flex items-center gap-1 text-neutral-500 tabular-nums">
                  <Clock className="w-3 h-3" />
                  <span>{executionResult.executionTimeMs} ms</span>
                </div>
              )}
            </div>

            {/* Console Output Feed */}
            <div className="flex-1 min-h-[160px] rounded-lg border border-neutral-800 bg-neutral-950 p-3 overflow-y-auto space-y-1.5">
              {executionResult.logs.length === 0 && !executionResult.error ? (
                <div className="h-full flex items-center justify-center text-neutral-600 text-xs">
                  <span>Click &quot;Run Script&quot; to test execution and view standard output logs.</span>
                </div>
              ) : (
                <>
                  {executionResult.logs.map((log) => (
                    <div
                      key={log.id}
                      className={`leading-relaxed flex items-start gap-2 ${
                        log.type === 'error'
                          ? 'text-red-400'
                          : log.type === 'warn'
                          ? 'text-amber-400'
                          : log.type === 'info'
                          ? 'text-sky-400'
                          : 'text-neutral-200'
                      }`}
                    >
                      <span className="text-neutral-600 select-none">&gt;</span>
                      <pre className="whitespace-pre-wrap flex-1">{log.content}</pre>
                    </div>
                  ))}

                  {executionResult.error && (
                    <div className="p-2 rounded bg-red-950/40 border border-red-900/60 text-red-300 mt-2">
                      <div className="font-semibold mb-0.5">Error Caught:</div>
                      <pre className="whitespace-pre-wrap">{executionResult.error}</pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
