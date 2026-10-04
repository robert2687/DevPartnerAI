import React, { useState } from 'react';
import {
  X,
  Layers,
  Sparkles,
  FileCode,
  CheckCircle2,
  ArrowRight,
  FolderGit2,
  ExternalLink,
  Play,
  Monitor,
} from 'lucide-react';
import { FULL_APP_TEMPLATES, FullAppTemplate } from '../data/fullAppTemplates.ts';

interface FullAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: FullAppTemplate, pushToGitHub?: boolean) => void;
  onGenerateCustomApp: (prompt: string) => void;
}

export const FullAppModal: React.FC<FullAppModalProps> = ({
  isOpen,
  onClose,
  onLoadTemplate,
  onGenerateCustomApp,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<FullAppTemplate>(FULL_APP_TEMPLATES[0]);
  const [activeFilePreview, setActiveFilePreview] = useState<string>(
    FULL_APP_TEMPLATES[0].files[0]?.filename || ''
  );
  const [customPrompt, setCustomPrompt] = useState<string>('');

  if (!isOpen) return null;

  const currentFile =
    selectedTemplate.files.find((f) => f.filename === activeFilePreview) ||
    selectedTemplate.files[0];

  const handleSelectTemplate = (template: FullAppTemplate) => {
    setSelectedTemplate(template);
    setActiveFilePreview(template.files[0]?.filename || '');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    onGenerateCustomApp(customPrompt.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Create Full Application</h2>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-semibold">
                  Multi-File Architecture
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Scaffold complete, production-ready full applications with instant Live Preview and GitHub deployment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          {/* Left Column: Template Selector & Custom Creator */}
          <div className="md:col-span-5 p-5 overflow-y-auto space-y-5 bg-neutral-950/60">
            {/* Custom AI Application Generator */}
            <div className="p-4 rounded-xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>AI Custom Full-App Generator</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Describe any full application you want to build and DevPartner AI will architect every file for you:
              </p>
              <form onSubmit={handleCustomSubmit} className="space-y-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. E-commerce store with product filter & cart..."
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={!customPrompt.trim()}
                  className="w-full py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-neutral-950 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Full Application</span>
                </button>
              </form>
            </div>

            {/* Pre-built Templates List */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Production-Ready Templates
              </div>

              <div className="space-y-2.5">
                {FULL_APP_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplate.id === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-neutral-800/90 border-sky-500/80 shadow-md ring-1 ring-sky-500/30'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-white leading-snug">{tmpl.name}</h4>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 font-medium ${
                            isSelected
                              ? 'bg-sky-950 text-sky-300 border border-sky-800'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {tmpl.files.length} files
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed mb-2">
                        {tmpl.description}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 text-neutral-300 border border-neutral-800">
                          {tmpl.category}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-900">
                          {tmpl.badge}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Template File Inspector & Actions */}
          <div className="md:col-span-7 flex flex-col overflow-hidden bg-neutral-900">
            {/* Template Header Info */}
            <div className="p-5 border-b border-neutral-800 bg-neutral-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedTemplate.name}</h3>
                  <p className="text-xs text-neutral-400">{selectedTemplate.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoadTemplate(selectedTemplate, false)}
                    className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load in Studio</span>
                  </button>

                  <button
                    onClick={() => onLoadTemplate(selectedTemplate, true)}
                    className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-neutral-700"
                    title="Load and open GitHub push dialog"
                  >
                    <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Push to GitHub</span>
                  </button>
                </div>
              </div>

              {/* Highlights pills */}
              <div className="flex flex-wrap gap-1.5">
                {selectedTemplate.highlights.map((h, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-300 font-mono"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                    <span>{h}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Multi-File Tab Bar */}
            <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-950/80 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[11px] text-neutral-500 font-mono shrink-0">Included Files:</span>
              {selectedTemplate.files.map((file) => {
                const isActive = file.filename === activeFilePreview;
                return (
                  <button
                    key={file.filename}
                    onClick={() => setActiveFilePreview(file.filename)}
                    className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 shrink-0 transition-colors ${
                      isActive
                        ? 'bg-neutral-800 text-sky-400 font-medium border border-neutral-700'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
                    }`}
                  >
                    <FileCode className="w-3 h-3" />
                    <span>{file.filename}</span>
                  </button>
                );
              })}
            </div>

            {/* Code File Preview Body */}
            <div className="flex-1 overflow-auto p-4 bg-neutral-950 font-mono text-xs text-neutral-300 leading-relaxed select-text">
              <pre className="whitespace-pre-wrap">{currentFile?.code || ''}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
