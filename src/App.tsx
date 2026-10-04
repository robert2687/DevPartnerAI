/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TopNav } from './components/TopNav.tsx';
import { WorkflowTracker } from './components/WorkflowTracker.tsx';
import { ChatPanel } from './components/ChatPanel.tsx';
import { CodeStudio } from './components/CodeStudio.tsx';
import { DiagnosticLab } from './components/DiagnosticLab.tsx';
import { WorkflowGuideView } from './components/WorkflowGuideView.tsx';
import { PromptLibraryModal } from './components/PromptLibraryModal.tsx';
import { EnvironmentModal } from './components/EnvironmentModal.tsx';
import { ExplanationDrawer } from './components/ExplanationDrawer.tsx';
import { GitHubModal } from './components/GitHubModal.tsx';
import { FullAppModal } from './components/FullAppModal.tsx';
import { FullAppTemplate } from './data/fullAppTemplates.ts';
import { Message, CodeArtifact, UserProfile, WorkflowStep } from './types.ts';
import { extractCodeArtifacts, detectWorkflowStep } from './utils/codeParser.ts';
import { MessageSquare, Code2 } from 'lucide-react';

const INITIAL_PROFILE: UserProfile = {
  preferredLanguage: 'TypeScript',
  framework: 'React / Node',
  experienceLevel: 'intermediate',
  activeWorkflowStep: 'Step 1: Requirement Gathering & Clarification',
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('devpartner_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((m: Message) => ({ ...m, isStreaming: false }));
        }
      }
      return [];
    } catch (e) {
      console.warn('Failed to load messages from localStorage:', e);
      return [];
    }
  });

  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const [activeWorkflowStep, setActiveWorkflowStep] = useState<WorkflowStep>(() => {
    try {
      const saved = localStorage.getItem('devpartner_workflow_step');
      if (saved && ['clarification', 'overview', 'implementation', 'general'].includes(saved)) {
        return saved as WorkflowStep;
      }
      return 'clarification';
    } catch {
      return 'clarification';
    }
  });

  const [artifacts, setArtifacts] = useState<CodeArtifact[]>(() => {
    try {
      const saved = localStorage.getItem('devpartner_artifacts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('devpartner_active_artifact_id') || null;
    } catch {
      return null;
    }
  });

  const [activeView, setActiveView] = useState<'workspace' | 'workflow' | 'debugger' | 'prompts'>('workspace');
  const [mobilePane, setMobilePane] = useState<'chat' | 'code'>('chat');

  // Modals & Drawers
  const [isEnvironmentModalOpen, setIsEnvironmentModalOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isExplanationDrawerOpen, setIsExplanationDrawerOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isFullAppModalOpen, setIsFullAppModalOpen] = useState(false);
  const [explanationSnippet, setExplanationSnippet] = useState<{ code: string; language: string }>({
    code: '',
    language: 'typescript',
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('devpartner_profile');
      return saved ? JSON.parse(saved) : INITIAL_PROFILE;
    } catch {
      return INITIAL_PROFILE;
    }
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Save profile changes
  useEffect(() => {
    try {
      localStorage.setItem('devpartner_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.warn('Failed to save profile to localStorage:', e);
    }
  }, [userProfile]);

  // Persist messages whenever they change
  useEffect(() => {
    try {
      const cleanMessages = messages.map((m) => ({
        ...m,
        isStreaming: false,
      }));
      localStorage.setItem('devpartner_messages', JSON.stringify(cleanMessages));
    } catch (e) {
      console.warn('Failed to persist messages to localStorage:', e);
    }
  }, [messages]);

  // Persist artifacts whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('devpartner_artifacts', JSON.stringify(artifacts));
    } catch (e) {
      console.warn('Failed to persist artifacts to localStorage:', e);
    }
  }, [artifacts]);

  // Persist workflow step
  useEffect(() => {
    try {
      localStorage.setItem('devpartner_workflow_step', activeWorkflowStep);
    } catch (e) {
      console.warn('Failed to persist workflow step to localStorage:', e);
    }
  }, [activeWorkflowStep]);

  // Persist active artifact ID
  useEffect(() => {
    try {
      if (activeArtifactId) {
        localStorage.setItem('devpartner_active_artifact_id', activeArtifactId);
      } else {
        localStorage.removeItem('devpartner_active_artifact_id');
      }
    } catch (e) {
      console.warn('Failed to persist active artifact ID to localStorage:', e);
    }
  }, [activeArtifactId]);

  // Ensure activeArtifactId points to a valid artifact if artifacts exist
  useEffect(() => {
    if (artifacts.length > 0 && (!activeArtifactId || !artifacts.some((a) => a.id === activeArtifactId))) {
      setActiveArtifactId(artifacts[0].id);
    }
  }, [artifacts, activeArtifactId]);

  // Send message and stream response from server
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsStreaming(true);

    const assistantMsgId = `asst-${Date.now() + 1}`;
    const initialAssistantMessage: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      workflowStep: activeWorkflowStep,
    };

    setMessages([...newMessages, initialAssistantMessage]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userProfile,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedContent += parsed.text;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          content: accumulatedContent,
                        }
                      : msg
                  )
                );
              } else if (parsed.error) {
                if (!accumulatedContent || !parsed.error.includes('Incomplete JSON')) {
                  accumulatedContent += `\n\n**Error:** ${parsed.error}`;
                }
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          content: accumulatedContent,
                          isStreaming: false,
                        }
                      : msg
                  )
                );
              }
            } catch {
              // Ignore partial JSON parse errors
            }
          }
        }
      }

      // Finalize message and extract artifacts
      const detectedStep = detectWorkflowStep(accumulatedContent);
      setActiveWorkflowStep(detectedStep);

      const extracted = extractCodeArtifacts(accumulatedContent);
      if (extracted.length > 0) {
        setArtifacts((prev) => {
          // Merge avoiding identical duplicates
          const existingFilenames = new Set(prev.map((a) => a.filename));
          const newUnique = extracted.filter((e) => !existingFilenames.has(e.filename));
          const updated = [...prev, ...newUnique];
          return updated;
        });

        if (extracted[0]) {
          setActiveArtifactId(extracted[0].id);
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: accumulatedContent,
                isStreaming: false,
                workflowStep: detectedStep,
                codeArtifacts: extracted,
              }
            : msg
        )
      );
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    msg.content +
                    `\n\n*An error occurred while generating response. Please check your server connection or API key.*`,
                  isStreaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  const handleResetSession = () => {
    if (window.confirm('Reset this consultation session? All active chat history will be cleared.')) {
      setMessages([]);
      setArtifacts([]);
      setActiveArtifactId(null);
      setActiveWorkflowStep('clarification');
      try {
        localStorage.removeItem('devpartner_messages');
        localStorage.removeItem('devpartner_artifacts');
        localStorage.removeItem('devpartner_workflow_step');
        localStorage.removeItem('devpartner_active_artifact_id');
      } catch (e) {
        console.warn('Failed to clear localStorage on session reset:', e);
      }
    }
  };

  const handleExportProject = () => {
    if (artifacts.length === 0) return;

    // Export as multi-file JSON bundle
    const exportBundle = {
      project: 'DevPartner AI Workspace Export',
      exportDate: new Date().toISOString(),
      activeWorkflowStep,
      files: artifacts.map((a) => ({
        filename: a.filename,
        language: a.language,
        code: a.code,
      })),
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `devpartner-project-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Open single artifact from chat block
  const handleOpenArtifactFromChat = (code: string, language: string, filename: string) => {
    const existing = artifacts.find((a) => a.filename === filename);
    if (existing) {
      setActiveArtifactId(existing.id);
    } else {
      const newArt: CodeArtifact = {
        id: `artifact-${Date.now()}`,
        filename: filename || `file.${language}`,
        language,
        code,
        timestamp: Date.now(),
      };
      setArtifacts((prev) => [...prev, newArt]);
      setActiveArtifactId(newArt.id);
    }
    setActiveView('workspace');
    setMobilePane('code');
  };

  const handleRunInSandboxFromChat = (code: string, language: string) => {
    handleOpenArtifactFromChat(code, language, language === 'html' ? 'index.html' : 'runner.ts');
  };

  const handleExplainCode = (code: string, language: string) => {
    setExplanationSnippet({ code, language });
    setIsExplanationDrawerOpen(true);
  };

  // Load a complete multi-file application template into Code Studio
  const handleLoadFullAppTemplate = (template: FullAppTemplate, pushToGitHub = false) => {
    const newArtifacts: CodeArtifact[] = template.files.map((file, idx) => ({
      id: `artifact-${Date.now()}-${idx}`,
      filename: file.filename,
      language: file.language,
      code: file.code,
      timestamp: Date.now(),
    }));

    setArtifacts(newArtifacts);
    if (newArtifacts.length > 0) {
      setActiveArtifactId(newArtifacts[0].id);
    }
    setIsFullAppModalOpen(false);
    setActiveView('workspace');
    setMobilePane('code');

    if (pushToGitHub) {
      setIsGitHubModalOpen(true);
    }
  };

  // Custom Full Application Generation from Natural Language Prompt
  const handleGenerateCustomApp = (prompt: string) => {
    setIsFullAppModalOpen(false);
    setActiveView('workspace');
    handleSendMessage(
      `Architect and build a complete production-grade multi-file application for: "${prompt}".\n\nPlease provide all necessary files with file names formatted as code blocks (e.g. index.html, style.css, script.js, package.json, README.md).`
    );
  };

  // Batch import files from GitHub repository explorer into Code Studio
  const handleImportArtifacts = (
    importedFiles: { filename: string; language: string; code: string }[],
    replaceAll = false
  ) => {
    const newArtifacts: CodeArtifact[] = importedFiles.map((file, idx) => ({
      id: `artifact-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      filename: file.filename,
      language: file.language,
      code: file.code,
      timestamp: Date.now(),
    }));

    if (replaceAll) {
      setArtifacts(newArtifacts);
      if (newArtifacts.length > 0) {
        setActiveArtifactId(newArtifacts[0].id);
      }
    } else {
      setArtifacts((prev) => {
        const incomingNames = new Set(newArtifacts.map((a) => a.filename));
        const retained = prev.filter((a) => !incomingNames.has(a.filename));
        return [...retained, ...newArtifacts];
      });
      if (newArtifacts.length > 0) {
        setActiveArtifactId(newArtifacts[0].id);
      }
    }

    setActiveView('workspace');
    setMobilePane('code');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans">
      {/* Top Bar Navigation */}
      <TopNav
        activeView={activeView}
        setActiveView={(v) => {
          if (v === 'prompts') {
            setIsPromptLibraryOpen(true);
          } else {
            setActiveView(v);
          }
        }}
        onResetSession={handleResetSession}
        onExportProject={handleExportProject}
        onOpenSettings={() => setIsEnvironmentModalOpen(true)}
        onOpenGitHub={() => setIsGitHubModalOpen(true)}
        onOpenFullAppModal={() => setIsFullAppModalOpen(true)}
        hasArtifacts={artifacts.length > 0}
        isGitHubConnected={Boolean(localStorage.getItem('devpartner_gh_token'))}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeView === 'workflow' ? (
          <WorkflowGuideView
            onStartStep={(prompt, step) => {
              setActiveWorkflowStep(step);
              setActiveView('workspace');
              handleSendMessage(prompt);
            }}
          />
        ) : activeView === 'debugger' ? (
          <DiagnosticLab
            currentArtifacts={artifacts}
            onApplyFixedCode={(filename, language, fixedCode) => {
              handleOpenArtifactFromChat(fixedCode, language, filename);
            }}
            onSendToChat={(prompt) => {
              setActiveView('workspace');
              handleSendMessage(prompt);
            }}
          />
        ) : (
          /* Workspace View (Split-Pane on Desktop, Tabbed on Mobile) */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 3-Step Workflow Progression Bar */}
            <WorkflowTracker
              currentStep={activeWorkflowStep}
              onSelectPromptNudge={(prompt) => handleSendMessage(prompt)}
              isStreaming={isStreaming}
            />

            {/* Split Panes */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Mobile Pane Switcher Header */}
              <div className="lg:hidden absolute top-0 left-0 right-0 z-20 flex bg-neutral-900 border-b border-neutral-800 text-xs">
                <button
                  onClick={() => setMobilePane('chat')}
                  className={`flex-1 py-2 text-center font-medium flex items-center justify-center gap-1.5 ${
                    mobilePane === 'chat'
                      ? 'bg-neutral-950 text-sky-400 border-b-2 border-sky-400'
                      : 'text-neutral-400'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Consultation Chat</span>
                </button>
                <button
                  onClick={() => setMobilePane('code')}
                  className={`flex-1 py-2 text-center font-medium flex items-center justify-center gap-1.5 ${
                    mobilePane === 'code'
                      ? 'bg-neutral-950 text-sky-400 border-b-2 border-sky-400'
                      : 'text-neutral-400'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Code Studio {artifacts.length > 0 ? `(${artifacts.length})` : ''}</span>
                </button>
              </div>

              {/* Left Pane: Chat Consultation */}
              <div
                className={`w-full lg:w-1/2 h-full flex flex-col border-r border-neutral-800 ${
                  mobilePane === 'chat' ? 'flex pt-9 lg:pt-0' : 'hidden lg:flex'
                }`}
              >
                <ChatPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isStreaming={isStreaming}
                  onStopStreaming={handleStopStreaming}
                  onOpenArtifact={handleOpenArtifactFromChat}
                  onRunInSandbox={handleRunInSandboxFromChat}
                  onExplainCode={handleExplainCode}
                  activeWorkflowStep={activeWorkflowStep}
                />
              </div>

              {/* Right Pane: Code Studio & Sandbox */}
              <div
                className={`w-full lg:w-1/2 h-full flex flex-col bg-neutral-950 ${
                  mobilePane === 'code' ? 'flex pt-9 lg:pt-0' : 'hidden lg:flex'
                }`}
              >
                <CodeStudio
                  artifacts={artifacts}
                  activeArtifactId={activeArtifactId}
                  onSelectArtifact={(id) => setActiveArtifactId(id)}
                  onUpdateArtifactCode={(id, newCode) => {
                    setArtifacts((prev) =>
                      prev.map((a) => (a.id === id ? { ...a, code: newCode } : a))
                    );
                  }}
                  onCreateArtifact={(filename, language) => {
                    const newArt: CodeArtifact = {
                      id: `art-${Date.now()}`,
                      filename,
                      language,
                      code: `// ${filename}\n\n`,
                      timestamp: Date.now(),
                    };
                    setArtifacts((prev) => [...prev, newArt]);
                    setActiveArtifactId(newArt.id);
                  }}
                  onDeleteArtifact={(id) => {
                    setArtifacts((prev) => prev.filter((a) => a.id !== id));
                    if (activeArtifactId === id) {
                      const remaining = artifacts.filter((a) => a.id !== id);
                      setActiveArtifactId(remaining[0]?.id || null);
                    }
                  }}
                  onExplainCode={handleExplainCode}
                  onOpenGitHub={() => setIsGitHubModalOpen(true)}
                  onOpenFullAppModal={() => setIsFullAppModalOpen(true)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Educational Logic Breakdown Drawer */}
      <ExplanationDrawer
        isOpen={isExplanationDrawerOpen}
        onClose={() => setIsExplanationDrawerOpen(false)}
        codeSnippet={explanationSnippet.code}
        language={explanationSnippet.language}
        onAskFollowup={(q) => handleSendMessage(q)}
      />

      {/* Prompt Library Modal */}
      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelectPrompt={(p) => {
          setActiveView('workspace');
          handleSendMessage(p);
        }}
      />

      {/* Environment & Stack Modal */}
      <EnvironmentModal
        isOpen={isEnvironmentModalOpen}
        onClose={() => setIsEnvironmentModalOpen(false)}
        profile={userProfile}
        onUpdateProfile={(updated) => setUserProfile(updated)}
      />

      {/* GitHub Integration & Repository Explorer Modal */}
      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        artifacts={artifacts}
        activeArtifactId={activeArtifactId}
        onImportArtifacts={handleImportArtifacts}
      />

      {/* Create Full Application Modal */}
      <FullAppModal
        isOpen={isFullAppModalOpen}
        onClose={() => setIsFullAppModalOpen(false)}
        onLoadTemplate={handleLoadFullAppTemplate}
        onGenerateCustomApp={handleGenerateCustomApp}
      />
    </div>
  );
}
