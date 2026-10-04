import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Terminal,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  CornerDownLeft,
  X,
  Filter,
} from 'lucide-react';
import { CodeArtifact, ExecutionLog, ExecutionResult } from '../types.ts';

interface LiveSandboxProps {
  artifact: CodeArtifact | null;
  allArtifacts?: CodeArtifact[];
  onCodeChange?: (updatedCode: string) => void;
}

export const LiveSandbox: React.FC<LiveSandboxProps> = ({
  artifact,
  allArtifacts = [],
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [canvasTheme, setCanvasTheme] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [testInput, setTestInput] = useState<string>('');

  // Virtual Console State below live preview
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState<boolean>(false);
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'error' | 'warn' | 'log'>('all');
  const [consoleSearch, setConsoleSearch] = useState<string>('');
  const [replInput, setReplInput] = useState<string>('');
  const [liveLogs, setLiveLogs] = useState<ExecutionLog[]>([]);

  const [executionResult, setExecutionResult] = useState<ExecutionResult>({
    logs: [],
    status: 'idle',
    executionTimeMs: 0,
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Check if code contains HTML or visual markup
  const isVisualCode = useMemo(() => {
    if (!artifact) return false;
    const code = artifact.code.toLowerCase();
    const lang = (artifact.language || '').toLowerCase();
    const filename = (artifact.filename || '').toLowerCase();

    return (
      lang === 'html' ||
      lang === 'jsx' ||
      lang === 'tsx' ||
      lang === 'css' ||
      filename.endsWith('.html') ||
      filename.endsWith('.css') ||
      filename.endsWith('.jsx') ||
      filename.endsWith('.tsx') ||
      code.includes('<!doctype') ||
      code.includes('<html') ||
      code.includes('<div') ||
      code.includes('document.getelementbyid') ||
      code.includes('document.queryselector') ||
      code.includes('reactdom.createRoot')
    );
  }, [artifact]);

  // Set default tab based on whether artifact is visual or backend script
  useEffect(() => {
    if (isVisualCode) {
      setActiveTab('preview');
    } else {
      setActiveTab('console');
    }
  }, [isVisualCode, artifact?.filename]);

  // Listen to messages from preview iframe (console logs & runtime errors)
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_CONSOLE') {
        const { level, message } = event.data;
        setLiveLogs((prev) => [
          ...prev.slice(-99), // Keep latest 100 logs
          {
            id: `log-${Date.now()}-${Math.random()}`,
            type:
              level === 'error'
                ? 'error'
                : level === 'warn'
                ? 'warn'
                : level === 'return'
                ? 'return'
                : level === 'info'
                ? 'info'
                : 'log',
            content: message,
            timestamp: Date.now(),
          },
        ]);
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  // Auto-scroll console when new logs arrive (if expanded)
  useEffect(() => {
    if (!isConsoleCollapsed && consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs.length, isConsoleCollapsed]);

  // Build bundled HTML for the live preview iframe with console & error interception
  const bundledHtml = useMemo(() => {
    if (!artifact) return '';

    const artifactsList = allArtifacts.length > 0 ? allArtifacts : [artifact];

    // Find main HTML file or create one
    const htmlArtifact = artifactsList.find(
      (a) => a.language === 'html' || a.filename.endsWith('.html')
    );
    const cssArtifacts = artifactsList.filter(
      (a) => a.language === 'css' || a.filename.endsWith('.css')
    );
    const jsArtifacts = artifactsList.filter(
      (a) =>
        (a.language === 'javascript' ||
          a.language === 'js' ||
          a.language === 'typescript' ||
          a.language === 'ts') &&
        !a.filename.endsWith('.html') &&
        !a.filename.endsWith('.css')
    );

    let baseHtml = '';

    if (htmlArtifact) {
      baseHtml = htmlArtifact.code;
    } else if (artifact.language === 'html' || artifact.code.includes('<html')) {
      baseHtml = artifact.code;
    } else {
      // Create a visual host for non-HTML active artifacts (e.g. CSS or JS)
      baseHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
</head>
<body class="p-6 font-sans">
  <div id="root" class="max-w-4xl mx-auto space-y-4">
    <div class="p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
      <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Live Component Preview</h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Rendering ${artifact.filename} in live preview canvas.</p>
      <div id="output" class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono"></div>
    </div>
  </div>
</body>
</html>`;
    }

    // Injected styles from CSS artifacts
    const styleTags = cssArtifacts
      .map((css) => `<style data-filename="${css.filename}">\n${css.code}\n</style>`)
      .join('\n');

    // Injected scripts from JS artifacts
    const scriptTags = jsArtifacts
      .map(
        (js) =>
          `<script data-filename="${js.filename}">\ntry {\n${js.code}\n} catch(err) { console.error(err); }\n</script>`
      )
      .join('\n');

    // Console & Error Interceptor script + Interactive REPL Evaluator
    const interceptorScript = `
<script>
  (function() {
    // Intercept uncaught runtime syntax and evaluation errors
    window.onerror = function(msg, url, line, col, error) {
      window.parent.postMessage({
        type: 'PREVIEW_CONSOLE',
        level: 'error',
        message: String(msg) + (line ? ' (Line ' + line + (col ? ':' + col : '') + ')' : '')
      }, '*');
      return false;
    };

    // Intercept unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      window.parent.postMessage({
        type: 'PREVIEW_CONSOLE',
        level: 'error',
        message: 'Unhandled Rejection: ' + String(event.reason?.message || event.reason)
      }, '*');
    });

    const _formatArg = function(arg) {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch(e) {
          return String(arg);
        }
      }
      return String(arg);
    };

    const _log = console.log;
    console.log = function(...args) {
      _log.apply(console, args);
      try {
        window.parent.postMessage({
          type: 'PREVIEW_CONSOLE',
          level: 'log',
          message: args.map(_formatArg).join(' ')
        }, '*');
      } catch(e) {}
    };

    const _info = console.info;
    console.info = function(...args) {
      _info.apply(console, args);
      try {
        window.parent.postMessage({
          type: 'PREVIEW_CONSOLE',
          level: 'info',
          message: args.map(_formatArg).join(' ')
        }, '*');
      } catch(e) {}
    };

    const _error = console.error;
    console.error = function(...args) {
      _error.apply(console, args);
      try {
        window.parent.postMessage({
          type: 'PREVIEW_CONSOLE',
          level: 'error',
          message: args.map(_formatArg).join(' ')
        }, '*');
      } catch(e) {}
    };

    const _warn = console.warn;
    console.warn = function(...args) {
      _warn.apply(console, args);
      try {
        window.parent.postMessage({
          type: 'PREVIEW_CONSOLE',
          level: 'warn',
          message: args.map(_formatArg).join(' ')
        }, '*');
      } catch(e) {}
    };

    // Listen for live REPL evaluations from the Virtual Console Pane
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'EVAL_EXPRESSION') {
        try {
          const res = (0, eval)(e.data.code);
          window.parent.postMessage({
            type: 'PREVIEW_CONSOLE',
            level: 'return',
            message: _formatArg(res)
          }, '*');
        } catch (err) {
          window.parent.postMessage({
            type: 'PREVIEW_CONSOLE',
            level: 'error',
            message: err.message || String(err)
          }, '*');
        }
      }
    });
  })();
</script>`;

    // Include Tailwind CSS automatically if detected
    const tailwindCdn = `<script src="https://cdn.tailwindcss.com"></script>`;

    // Insert Tailwind, Styles, Scripts into the HTML document
    let finalDoc = baseHtml;

    if (!finalDoc.includes('cdn.tailwindcss.com')) {
      finalDoc = finalDoc.replace('</head>', `${tailwindCdn}\n</head>`);
      if (!finalDoc.includes(tailwindCdn)) {
        finalDoc = `<head>${tailwindCdn}</head>\n${finalDoc}`;
      }
    }

    if (styleTags) {
      finalDoc = finalDoc.replace('</head>', `${styleTags}\n</head>`);
    }

    finalDoc = finalDoc.replace('<head>', `<head>\n${interceptorScript}`);

    if (scriptTags) {
      finalDoc = finalDoc.replace('</body>', `${scriptTags}\n</body>`);
    }

    return finalDoc;
  }, [artifact, allArtifacts]);

  // Update Preview iframe with debounce for real-time live typing
  useEffect(() => {
    if (activeTab !== 'preview') return;

    const timer = setTimeout(() => {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(bundledHtml);
          doc.close();
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [bundledHtml, activeTab]);

  // Manual Frame Reload
  const handleReloadFrame = () => {
    setLiveLogs([]);
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(bundledHtml);
        doc.close();
      }
    }
  };

  // REPL Expression Evaluator
  const handleReplSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replInput.trim()) return;

    const code = replInput.trim();
    setReplInput('');

    // Append user input as an echo log
    setLiveLogs((prev) => [
      ...prev,
      {
        id: `eval-input-${Date.now()}`,
        type: 'info',
        content: `> ${code}`,
        timestamp: Date.now(),
      },
    ]);

    // Send to iframe for sandbox execution
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'EVAL_EXPRESSION',
          code,
        },
        '*'
      );
    }
  };

  // Clear Virtual Console logs
  const handleClearConsole = () => {
    setLiveLogs([]);
  };

  // Filtered Console Logs
  const filteredLogs = useMemo(() => {
    return liveLogs.filter((log) => {
      if (consoleFilter !== 'all' && log.type !== consoleFilter) {
        return false;
      }
      if (consoleSearch.trim()) {
        return log.content.toLowerCase().includes(consoleSearch.toLowerCase().trim());
      }
      return true;
    });
  }, [liveLogs, consoleFilter, consoleSearch]);

  const errorCount = useMemo(() => liveLogs.filter((l) => l.type === 'error').length, [liveLogs]);
  const warnCount = useMemo(() => liveLogs.filter((l) => l.type === 'warn').length, [liveLogs]);

  // Execute Non-Visual JavaScript in Console Runner (dedicated console tab)
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
      const customConsole = {
        log: (...args: unknown[]) => {
          logs.push({
            id: `log-${Date.now()}-${Math.random()}`,
            type: 'log',
            content: args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' '),
            timestamp: Date.now(),
          });
        },
        info: (...args: unknown[]) => {
          logs.push({
            id: `log-${Date.now()}-${Math.random()}`,
            type: 'info',
            content: args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' '),
            timestamp: Date.now(),
          });
        },
        warn: (...args: unknown[]) => {
          logs.push({
            id: `log-${Date.now()}-${Math.random()}`,
            type: 'warn',
            content: args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' '),
            timestamp: Date.now(),
          });
        },
        error: (...args: unknown[]) => {
          logs.push({
            id: `log-${Date.now()}-${Math.random()}`,
            type: 'error',
            content: args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' '),
            timestamp: Date.now(),
          });
        },
      };

      let runnableCode = artifact.code;
      // Strip common typescript constructs for in-memory JS execution
      runnableCode = runnableCode.replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '');
      runnableCode = runnableCode.replace(/type\s+\w+\s*=[\s\S]*?;/g, '');

      // Evaluate safely inside sandbox function
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const runner = new Function(
        'console',
        'input',
        `
        try {
          ${runnableCode}
          ${testInput.trim() ? `\n// Test invocation:\n${testInput}` : ''}
        } catch(e) {
          console.error(e.message || String(e));
          throw e;
        }
      `
      );

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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  if (!artifact) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500">
        <Terminal className="w-8 h-8 mb-2 stroke-1" />
        <p className="text-sm">Select or generate code in Code Studio to see the Live Preview.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col bg-neutral-950 text-neutral-200 overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 p-4' : ''
      }`}
    >
      {/* Top Sandbox Header / Controls Bar */}
      <div className="px-3 py-2 border-b border-neutral-800 bg-neutral-900/90 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none">
        {/* Left: View Tabs (Live Preview vs Console) */}
        <div className="flex items-center gap-1.5 p-0.5 rounded bg-neutral-950 border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 font-medium ${
              activeTab === 'preview'
                ? 'bg-sky-500 text-neutral-950 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 font-medium ${
              activeTab === 'console'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Standalone Console</span>
          </button>
        </div>

        {/* Center: Device Viewport Controls (in Preview Mode) */}
        {activeTab === 'preview' && (
          <div className="hidden sm:flex items-center gap-1 p-0.5 rounded bg-neutral-950 border border-neutral-800 text-xs">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1 rounded transition-colors ${
                viewport === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Desktop Viewport (Fluid 100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1 rounded transition-colors ${
                viewport === 'tablet' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Tablet Viewport (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1 rounded transition-colors ${
                viewport === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Mobile Viewport (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Actions (Reload, Theme, Fullscreen, Run) */}
        <div className="flex items-center gap-2">
          {activeTab === 'preview' ? (
            <>
              {/* Background Canvas Theme Switcher */}
              <button
                onClick={() => setCanvasTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title={`Switch preview background to ${canvasTheme === 'dark' ? 'light' : 'dark'}`}
              >
                {canvasTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              {/* Reload Frame */}
              <button
                onClick={handleReloadFrame}
                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1 transition-colors"
                title="Refresh Live Preview"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </>
          ) : (
            <button
              onClick={executeCode}
              disabled={executionResult.status === 'running'}
              className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Script</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'preview' ? (
          <>
            {/* Top Half: Live Preview Canvas */}
            <div
              className={`flex-1 overflow-auto flex items-center justify-center p-3 transition-colors ${
                canvasTheme === 'dark' ? 'bg-neutral-950' : 'bg-neutral-200'
              }`}
            >
              <div
                className={`h-full bg-white shadow-2xl overflow-hidden transition-all duration-300 rounded-lg border border-neutral-700/50 flex flex-col ${
                  viewport === 'mobile'
                    ? 'w-[375px]'
                    : viewport === 'tablet'
                    ? 'w-[768px]'
                    : 'w-full'
                }`}
              >
                {/* Device Frame Header info */}
                <div className="px-3 py-1 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 select-none shrink-0">
                  <span className="font-mono text-[10px] text-neutral-300">
                    {viewport === 'mobile'
                      ? 'Mobile (375 × 667)'
                      : viewport === 'tablet'
                      ? 'Tablet (768 × 1024)'
                      : 'Desktop (Fluid)'}
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Sync
                  </span>
                </div>

                {/* Preview Iframe */}
                <iframe
                  ref={iframeRef}
                  title="Live Code Preview"
                  sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                  className="w-full flex-1 border-0 bg-white"
                />
              </div>
            </div>

            {/* Bottom Half: Virtual Console Pane */}
            <div className="border-t border-neutral-850 bg-neutral-950 flex flex-col shrink-0 select-none">
              {/* Virtual Console Header Bar */}
              <div className="px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-2 text-xs">
                {/* Left: Title & Counters */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsConsoleCollapsed((prev) => !prev)}
                    className="flex items-center gap-1.5 font-semibold text-neutral-200 hover:text-white transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-sky-400" />
                    <span>Virtual Console</span>
                    {isConsoleCollapsed ? (
                      <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                      {liveLogs.length} logs
                    </span>

                    {errorCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800/80 font-bold">
                        {errorCount} error{errorCount > 1 ? 's' : ''}
                      </span>
                    )}

                    {warnCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800/80">
                        {warnCount} warning{warnCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Controls & Filters */}
                <div className="flex items-center gap-2">
                  {!isConsoleCollapsed && (
                    <>
                      {/* Filter tabs */}
                      <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded bg-neutral-950 border border-neutral-800 text-[11px]">
                        <button
                          onClick={() => setConsoleFilter('all')}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            consoleFilter === 'all'
                              ? 'bg-neutral-800 text-white font-medium'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setConsoleFilter('error')}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            consoleFilter === 'error'
                              ? 'bg-red-900/60 text-red-200 font-medium'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Errors
                        </button>
                        <button
                          onClick={() => setConsoleFilter('warn')}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            consoleFilter === 'warn'
                              ? 'bg-amber-900/60 text-amber-200 font-medium'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Warns
                        </button>
                        <button
                          onClick={() => setConsoleFilter('log')}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            consoleFilter === 'log'
                              ? 'bg-neutral-800 text-white font-medium'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Logs
                        </button>
                      </div>

                      {/* Log Search Filter */}
                      <div className="relative flex items-center">
                        <Search className="w-3 h-3 absolute left-1.5 text-neutral-500 pointer-events-none" />
                        <input
                          type="text"
                          value={consoleSearch}
                          onChange={(e) => setConsoleSearch(e.target.value)}
                          placeholder="Filter logs..."
                          className="w-24 sm:w-28 pl-5 pr-4 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
                        />
                        {consoleSearch && (
                          <button
                            onClick={() => setConsoleSearch('')}
                            className="absolute right-1 text-neutral-400 hover:text-white"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* Clear Console */}
                  <button
                    onClick={handleClearConsole}
                    className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    title="Clear Console Output"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Collapsible Log Feed & REPL Area */}
              {!isConsoleCollapsed && (
                <div className="flex flex-col h-44 bg-neutral-950">
                  {/* Log Feed List */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs select-text">
                    {filteredLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-neutral-500 text-[11px] font-sans">
                        <span>No console output. Call console.log(...) or interact with the preview to see logs.</span>
                      </div>
                    ) : (
                      filteredLogs.map((log) => {
                        const timeStr = new Date(log.timestamp).toLocaleTimeString();
                        return (
                          <div
                            key={log.id}
                            className={`flex items-start gap-2 py-0.5 px-1.5 rounded transition-colors ${
                              log.type === 'error'
                                ? 'bg-red-950/30 text-red-300 border-l-2 border-red-500'
                                : log.type === 'warn'
                                ? 'bg-amber-950/20 text-amber-300 border-l-2 border-amber-500'
                                : log.type === 'return'
                                ? 'bg-sky-950/30 text-sky-300 border-l-2 border-sky-400'
                                : log.type === 'info'
                                ? 'text-neutral-400 font-medium'
                                : 'text-neutral-200 hover:bg-neutral-900/50'
                            }`}
                          >
                            <span className="text-[10px] text-neutral-600 shrink-0 tabular-nums">
                              {timeStr}
                            </span>

                            <span
                              className={`text-[10px] px-1 py-0.2 rounded uppercase shrink-0 font-bold ${
                                log.type === 'error'
                                  ? 'bg-red-900/50 text-red-300'
                                  : log.type === 'warn'
                                  ? 'bg-amber-900/50 text-amber-300'
                                  : log.type === 'return'
                                  ? 'bg-sky-900/50 text-sky-200'
                                  : 'bg-neutral-800 text-neutral-400'
                              }`}
                            >
                              {log.type === 'return' ? '<' : log.type}
                            </span>

                            <pre className="whitespace-pre-wrap break-all flex-1 text-xs leading-5">
                              {log.content}
                            </pre>
                          </div>
                        );
                      })
                    )}
                    <div ref={consoleBottomRef} />
                  </div>

                  {/* Interactive REPL Expression Input */}
                  <form
                    onSubmit={handleReplSubmit}
                    className="border-t border-neutral-850 bg-neutral-900/70 px-2.5 py-1.5 flex items-center gap-2 shrink-0"
                  >
                    <span className="text-sky-400 font-mono font-bold text-xs select-none">&gt;</span>
                    <input
                      type="text"
                      value={replInput}
                      onChange={(e) => setReplInput(e.target.value)}
                      placeholder="Evaluate expression in preview iframe (e.g. document.title, window)..."
                      className="flex-1 bg-transparent text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none font-mono"
                    />
                    <button
                      type="submit"
                      disabled={!replInput.trim()}
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 rounded text-[11px] font-mono flex items-center gap-1 transition-colors"
                    >
                      <span>Eval</span>
                      <CornerDownLeft className="w-2.5 h-2.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Standalone Runtime Console View (for Python / Backend / Algo runner) */
          <div className="h-full flex flex-col p-4 space-y-4 overflow-y-auto font-mono text-xs">
            {/* Quick Test Execution Harness */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-medium font-sans">
                  Execution Harness / Custom Test Input:
                </span>
                <span className="text-[10px] text-neutral-500 font-sans">
                  Run custom invocations against your functions
                </span>
              </div>
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="e.g. console.log(executeTask({ id: 1 }));"
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
              {executionResult.logs.length === 0 && !executionResult.error && liveLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-neutral-600 text-xs">
                  <span>Click &quot;Run Script&quot; to test execution, or interact with Live Preview to capture logs.</span>
                </div>
              ) : (
                <>
                  {[...executionResult.logs, ...liveLogs].map((log) => (
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
