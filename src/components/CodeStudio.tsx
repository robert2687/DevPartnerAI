import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Play,
  BookOpen,
  Plus,
  Trash2,
  Columns,
  Code2,
  FolderGit2,
  Search,
  X,
  Eye,
  Layers,
} from 'lucide-react';
import { CodeArtifact } from '../types.ts';
import { LiveSandbox } from './LiveSandbox.tsx';

interface CodeStudioProps {
  artifacts: CodeArtifact[];
  activeArtifactId: string | null;
  onSelectArtifact: (id: string) => void;
  onUpdateArtifactCode: (id: string, newCode: string) => void;
  onCreateArtifact: (filename: string, language: string) => void;
  onDeleteArtifact: (id: string) => void;
  onExplainCode: (code: string, language: string) => void;
  onOpenGitHub?: () => void;
  onOpenFullAppModal?: () => void;
}

export const CodeStudio: React.FC<CodeStudioProps> = ({
  artifacts,
  activeArtifactId,
  onSelectArtifact,
  onUpdateArtifactCode,
  onCreateArtifact,
  onDeleteArtifact,
  onExplainCode,
  onOpenGitHub,
  onOpenFullAppModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('split');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFilename, setNewFilename] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId) || artifacts[0] || null;

  // Filter artifacts by search query (matches filename, language, or content)
  const filteredArtifacts = searchQuery.trim()
    ? artifacts.filter((art) => {
        const query = searchQuery.toLowerCase().trim();
        return (
          art.filename.toLowerCase().includes(query) ||
          art.language.toLowerCase().includes(query) ||
          art.code.toLowerCase().includes(query)
        );
      })
    : artifacts;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredArtifacts.length > 0) {
      onSelectArtifact(filteredArtifacts[0].id);
    } else if (e.key === 'Escape') {
      setSearchQuery('');
    }
  };

  const handleCopy = () => {
    if (!activeArtifact) return;
    navigator.clipboard.writeText(activeArtifact.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeArtifact) return;
    const blob = new Blob([activeArtifact.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeArtifact.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilename.trim()) return;

    const parts = newFilename.trim().split('.');
    const ext = parts.length > 1 ? parts.pop() || 'ts' : 'ts';
    onCreateArtifact(newFilename.trim(), ext);
    setNewFilename('');
    setIsCreatingFile(false);
  };

  const lines = activeArtifact ? activeArtifact.code.split('\n') : [];

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Top File Tabs & Actions Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-2 shrink-0 select-none overflow-x-auto gap-2">
        <div className="flex items-center gap-1 py-1 overflow-x-auto shrink min-w-0">
          {/* File Tabs */}
          {filteredArtifacts.map((art) => {
            const isActive = art.id === (activeArtifact?.id ?? '');
            return (
              <div
                key={art.id}
                onClick={() => onSelectArtifact(art.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 text-xs rounded-t border-t-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-neutral-950 border-sky-400 text-white font-medium shadow-sm'
                    : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-neutral-500'}`} />
                <span className="font-mono text-xs">{art.filename}</span>
                {artifacts.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteArtifact(art.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-0.5"
                    title="Close file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Empty search results indicator */}
          {searchQuery.trim() && filteredArtifacts.length === 0 && (
            <div className="flex items-center gap-2 px-2.5 py-1 text-xs text-neutral-400 font-mono italic">
              <span>No files match &quot;{searchQuery}&quot;</span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sky-400 hover:underline not-italic text-[11px]"
              >
                Clear
              </button>
            </div>
          )}

          {/* Add file inline trigger */}
          {isCreatingFile ? (
            <form onSubmit={handleCreateSubmit} className="flex items-center gap-1 shrink-0">
              <input
                type="text"
                autoFocus
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                placeholder="filename.ext"
                className="bg-neutral-950 border border-sky-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="text-[11px] bg-sky-500 text-neutral-950 px-2 py-0.5 rounded font-medium"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingFile(false)}
                className="text-[11px] text-neutral-400 px-1 hover:text-white"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreatingFile(true)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors text-xs flex items-center gap-1 shrink-0"
              title="Add new file"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode & Actions Toolbar */}
        <div className="flex items-center gap-2 py-1 shrink-0">
          {/* File Search Bar */}
          {artifacts.length > 0 && (
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2 text-neutral-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Filter files..."
                title="Search files by name, type, or code (Enter to select, Esc to clear)"
                className="w-24 sm:w-36 focus:w-44 transition-all pl-7 pr-6 py-1 bg-neutral-950 border border-neutral-800 focus:border-sky-500 rounded text-xs text-white placeholder-neutral-500 focus:outline-none font-mono"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 p-0.5 text-neutral-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center gap-0.5 p-0.5 rounded bg-neutral-950 border border-neutral-800 text-[11px]">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-2 py-0.5 rounded transition-colors ${
                viewMode === 'editor' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                viewMode === 'preview' ? 'bg-sky-500 text-neutral-950 font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Live Preview</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden lg:flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                viewMode === 'split' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
              }`}
              title="Split View"
            >
              <Columns className="w-3 h-3" />
              <span>Split</span>
            </button>
          </div>

          {onOpenFullAppModal && (
            <button
              onClick={onOpenFullAppModal}
              className="px-2.5 py-1 text-xs text-sky-400 hover:text-sky-300 hover:bg-neutral-800 rounded flex items-center gap-1.5 transition-colors font-medium border border-sky-500/30 shrink-0"
              title="Create full multi-file application from templates or custom AI prompt"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Full App</span>
            </button>
          )}

          {activeArtifact && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onExplainCode(activeArtifact.code, activeArtifact.language)}
                className="px-2 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded flex items-center gap-1 transition-colors"
                title="Explain code logic"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Explain</span>
              </button>

              <button
                onClick={handleCopy}
                className="px-2 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded flex items-center gap-1 transition-colors"
                title="Copy code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden xl:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-2 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded flex items-center gap-1 transition-colors"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Save</span>
              </button>

              {onOpenGitHub && (
                <button
                  onClick={onOpenGitHub}
                  className="px-2 py-1 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded flex items-center gap-1 transition-colors"
                  title="Export to GitHub Gist or Repository"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden xl:inline">GitHub</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex overflow-hidden">
        {(!artifacts || artifacts.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400 max-w-lg mx-auto space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-sky-400 shadow-lg">
              <Code2 className="w-6 h-6 stroke-1.5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white mb-1">Code Studio Ready</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Scaffold a production-grade multi-file application, connect to existing GitHub repositories, or start from scratch.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {onOpenFullAppModal && (
                <button
                  onClick={onOpenFullAppModal}
                  className="p-3.5 rounded-xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-sky-500/40 hover:border-sky-500 hover:shadow-lg transition-all space-y-1.5 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
                    <Layers className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Create Full Application</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Scaffold complete SaaS dashboards, Kanban boards, or custom full-stack apps.
                  </p>
                </button>
              )}

              {onOpenGitHub && (
                <button
                  onClick={onOpenGitHub}
                  className="p-3.5 rounded-xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:shadow-lg transition-all space-y-1.5 group cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-neutral-200 font-semibold text-xs">
                    <FolderGit2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Connect to GitHub Repos</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Explore branches, inspect file trees, and import existing repositories.
                  </p>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Editor Pane */}
            {(viewMode === 'editor' || viewMode === 'split') && (
              <div className={`flex-1 flex overflow-hidden bg-neutral-950 ${viewMode === 'split' ? 'border-r border-neutral-800' : ''}`}>
                {/* Line numbers gutter */}
                <div className="py-3 px-2 bg-neutral-900/40 select-none text-right font-mono text-xs text-neutral-600 tabular-nums border-r border-neutral-850 w-12 shrink-0">
                  {lines.map((_, i) => (
                    <div key={i} className="leading-6">
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Editable Code Canvas */}
                <textarea
                  value={activeArtifact?.code || ''}
                  onChange={(e) => {
                    if (activeArtifact) {
                      onUpdateArtifactCode(activeArtifact.id, e.target.value);
                    }
                  }}
                  spellCheck={false}
                  className="flex-1 p-3 bg-transparent text-neutral-200 font-mono text-xs leading-6 resize-none focus:outline-none whitespace-pre overflow-auto"
                />
              </div>
            )}

            {/* Live Preview / Sandbox Pane */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className="flex-1 h-full overflow-hidden">
                <LiveSandbox
                  artifact={activeArtifact}
                  allArtifacts={artifacts}
                  onCodeChange={(code) => {
                    if (activeArtifact) {
                      onUpdateArtifactCode(activeArtifact.id, code);
                    }
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Status Bar */}
      {activeArtifact && (
        <div className="h-6 px-3 border-t border-neutral-850 bg-neutral-950 flex items-center justify-between text-[11px] text-neutral-500 font-mono select-none">
          <div className="flex items-center gap-3">
            <span>{activeArtifact.filename}</span>
            <span>·</span>
            <span className="uppercase">{activeArtifact.language}</span>
          </div>

          <div className="flex items-center gap-3 tabular-nums">
            <span>{lines.length} lines</span>
            <span>·</span>
            <span>{activeArtifact.code.length} chars</span>
            <span>·</span>
            <span>UTF-8</span>
          </div>
        </div>
      )}
    </div>
  );
};
