import React from 'react';
import { Download, RotateCcw, Settings, Terminal, Compass, BookOpen, FolderGit2 } from 'lucide-react';

interface TopNavProps {
  activeView: 'workspace' | 'workflow' | 'debugger' | 'prompts';
  setActiveView: (view: 'workspace' | 'workflow' | 'debugger' | 'prompts') => void;
  onResetSession: () => void;
  onExportProject: () => void;
  onOpenSettings: () => void;
  onOpenGitHub: () => void;
  hasArtifacts: boolean;
  isGitHubConnected: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeView,
  setActiveView,
  onResetSession,
  onExportProject,
  onOpenSettings,
  onOpenGitHub,
  hasArtifacts,
  isGitHubConnected,
}) => {
  return (
    <header className="h-14 border-b border-neutral-800 bg-neutral-950 px-4 md:px-6 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Zone 1: Brand wordmark as single text element */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('workspace');
          }}
          className="text-base font-bold tracking-tight text-white hover:text-neutral-200 transition-colors"
        >
          DevPartner AI
        </a>
      </div>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-400">
        <button
          onClick={() => setActiveView('workspace')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeView === 'workspace'
              ? 'text-sky-400 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Workspace</span>
        </button>

        <button
          onClick={() => setActiveView('workflow')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeView === 'workflow'
              ? 'text-sky-400 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>3-Step Workflow</span>
        </button>

        <button
          onClick={() => setActiveView('debugger')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeView === 'debugger'
              ? 'text-sky-400 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Diagnostic Lab</span>
        </button>

        <button
          onClick={() => setActiveView('prompts')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeView === 'prompts'
              ? 'text-sky-400 font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Prompt Library</span>
        </button>

        <button
          onClick={onOpenGitHub}
          className="flex items-center gap-1.5 hover:text-neutral-200 transition-colors whitespace-nowrap relative"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-neutral-300" />
          <span>GitHub</span>
          {isGitHubConnected && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-neutral-950"></span>
          )}
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 hover:text-neutral-200 transition-colors whitespace-nowrap"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Environment</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onResetSession}
          title="Start fresh conversation"
          className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Session</span>
        </button>

        <button
          onClick={onExportProject}
          disabled={!hasArtifacts}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap ${
            hasArtifacts
              ? 'bg-sky-500 hover:bg-sky-400 text-neutral-950 font-semibold shadow-sm shadow-sky-500/20 active:scale-95'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Code</span>
        </button>
      </div>
    </header>
  );
};
