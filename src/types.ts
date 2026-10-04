export type WorkflowStep = 'clarification' | 'overview' | 'implementation' | 'general';

export interface CodeArtifact {
  id: string;
  filename: string;
  language: string;
  code: string;
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  workflowStep?: WorkflowStep;
  codeArtifacts?: CodeArtifact[];
  isStreaming?: boolean;
}

export interface UserProfile {
  preferredLanguage: string;
  framework: string;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  activeWorkflowStep: string;
}

export interface ExecutionLog {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'return';
  content: string;
  timestamp: number;
}

export interface ExecutionResult {
  logs: ExecutionLog[];
  returnValue?: string;
  error?: string;
  executionTimeMs: number;
  status: 'idle' | 'running' | 'success' | 'error';
}

export interface StarterPrompt {
  id: string;
  title: string;
  tag: string;
  prompt: string;
  step: WorkflowStep;
}

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  total_private_repos?: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string;
  language: string;
}

export interface GitHubGistResult {
  id: string;
  html_url: string;
  description: string;
  created_at: string;
}

