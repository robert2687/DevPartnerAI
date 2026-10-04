import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Check,
  Copy,
  FolderGit2,
  FileCode,
  Lock,
  Globe,
  RefreshCw,
  LogOut,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { CodeArtifact, GitHubUser, GitHubRepo } from '../types.ts';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifacts: CodeArtifact[];
  onImportArtifact?: (filename: string, language: string, code: string) => void;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  artifacts,
}) => {
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('devpartner_gh_token') || '';
  });
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'gist' | 'repo' | 'repos' | 'setup'>('gist');
  const [patInput, setPatInput] = useState<string>('');
  const [copiedCallback, setCopiedCallback] = useState<boolean>(false);

  // Form states
  const [gistDesc, setGistDesc] = useState<string>('DevPartner AI Code Export');
  const [gistPublic, setGistPublic] = useState<boolean>(true);
  const [repoName, setRepoName] = useState<string>('devpartner-project');
  const [repoDesc, setRepoDesc] = useState<string>('Generated with DevPartner AI');
  const [repoPrivate, setRepoPrivate] = useState<boolean>(false);

  const devCallbackUrl = `${window.location.origin}/auth/callback`;

  // Listen for OAuth success from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const receivedToken = event.data.token;
        if (receivedToken) {
          setToken(receivedToken);
          localStorage.setItem('devpartner_gh_token', receivedToken);
          fetchUserData(receivedToken);
          setSuccessMessage('Successfully connected to GitHub via OAuth!');
          setError(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fetch user data on token change
  useEffect(() => {
    if (token && isOpen && !user) {
      fetchUserData(token);
    }
  }, [token, isOpen]);

  const fetchUserData = async (activeToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/github/user', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch GitHub profile');
      }
      setUser(data);
      fetchUserRepos(activeToken);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      // If token is invalid, clear it
      if (error.message.includes('401') || error.message.includes('Bad credentials')) {
        handleDisconnect();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserRepos = async (activeToken: string) => {
    try {
      const res = await fetch('/api/github/repos', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();
      if (res.ok && data.repos) {
        setRepos(data.repos);
      }
    } catch {
      // Ignore background repos error
    }
  };

  const handleOAuthConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/github/url?origin=${encodeURIComponent(window.location.origin)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'GitHub OAuth is not configured on the server yet.');
      }

      // Open OAuth provider URL directly in popup as required by AI Studio guidelines
      const authWindow = window.open(
        data.url,
        'github_oauth_popup',
        'width=600,height=700,scrollbars=yes'
      );

      if (!authWindow) {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
      setActiveTab('setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patInput.trim()) return;
    const cleanToken = patInput.trim();
    setToken(cleanToken);
    localStorage.setItem('devpartner_gh_token', cleanToken);
    setPatInput('');
    fetchUserData(cleanToken);
  };

  const handleDisconnect = () => {
    setToken('');
    setUser(null);
    setRepos([]);
    localStorage.removeItem('devpartner_gh_token');
    setSuccessMessage(null);
    setCreatedUrl(null);
  };

  // Create GitHub Gist
  const handleCreateGist = async () => {
    if (!token || artifacts.length === 0) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setCreatedUrl(null);

    const filesPayload: Record<string, string> = {};
    artifacts.forEach((art) => {
      filesPayload[art.filename] = art.code;
    });

    try {
      const res = await fetch('/api/github/gist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: gistDesc,
          isPublic: gistPublic,
          files: filesPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create Gist');
      }

      setSuccessMessage('GitHub Gist successfully created!');
      setCreatedUrl(data.html_url);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Create GitHub Repository
  const handleCreateRepo = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setCreatedUrl(null);

    try {
      const res = await fetch('/api/github/create-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: repoName,
          description: repoDesc,
          isPrivate: repoPrivate,
          files: artifacts,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create GitHub repository');
      }

      setSuccessMessage(`Repository '${data.full_name}' created and files pushed!`);
      setCreatedUrl(data.html_url);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(devCallbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-neutral-950 border border-neutral-700 flex items-center justify-center text-white">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">GitHub Integration</h2>
              <p className="text-[11px] text-neutral-400">
                Connect your account to publish Gists, push repositories, and export code
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

        {/* User Status Bar if Connected */}
        {user ? (
          <div className="px-5 py-3 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar_url}
                alt={user.login}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-neutral-700"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">{user.name || user.login}</span>
                  <a
                    href={user.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-neutral-400 hover:text-sky-400 font-mono flex items-center gap-0.5"
                  >
                    @{user.login}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {user.public_repos} public repos
                </span>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-red-400 hover:bg-neutral-900 border border-neutral-800 rounded flex items-center gap-1.5 transition-colors"
              title="Disconnect GitHub account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        ) : null}

        {/* Tab Navigation if Connected */}
        {user ? (
          <div className="flex items-center px-5 border-b border-neutral-800 bg-neutral-900/60 text-xs gap-4">
            <button
              onClick={() => {
                setActiveTab('gist');
                setError(null);
                setSuccessMessage(null);
                setCreatedUrl(null);
              }}
              className={`py-2.5 border-b-2 font-medium transition-colors ${
                activeTab === 'gist'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Publish to Gist
            </button>
            <button
              onClick={() => {
                setActiveTab('repo');
                setError(null);
                setSuccessMessage(null);
                setCreatedUrl(null);
              }}
              className={`py-2.5 border-b-2 font-medium transition-colors ${
                activeTab === 'repo'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Create Repository
            </button>
            <button
              onClick={() => {
                setActiveTab('repos');
                setError(null);
                setSuccessMessage(null);
                setCreatedUrl(null);
              }}
              className={`py-2.5 border-b-2 font-medium transition-colors ${
                activeTab === 'repos'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              My Repositories ({repos.length})
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`py-2.5 border-b-2 font-medium transition-colors ml-auto ${
                activeTab === 'setup'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              OAuth Settings
            </button>
          </div>
        ) : null}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Notifications */}
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
              {createdUrl && (
                <div>
                  <a
                    href={createdUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 rounded text-xs font-mono transition-colors"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Not Connected State */}
          {!user ? (
            <div className="space-y-6">
              <div className="text-center py-4 space-y-2">
                <FolderGit2 className="w-12 h-12 mx-auto text-neutral-400 stroke-1" />
                <h3 className="text-base font-semibold text-white">Connect Your GitHub Account</h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                  Authenticate with GitHub to instantly publish your generated algorithms, REST APIs, and components
                  as public/secret Gists or full Git repositories.
                </p>
              </div>

              {/* OAuth Button */}
              <div className="space-y-3">
                <button
                  onClick={handleOAuthConnect}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-neutral-900" />
                  ) : (
                    <FolderGit2 className="w-4 h-4" />
                  )}
                  <span>Connect with GitHub (OAuth Popup)</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-neutral-800"></div>
                  <span className="flex-shrink mx-3 text-[11px] text-neutral-500 uppercase font-mono">
                    Or Use Personal Access Token
                  </span>
                  <div className="flex-grow border-t border-neutral-800"></div>
                </div>

                {/* Personal Access Token Alternative */}
                <form onSubmit={handlePatConnect} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                      <input
                        type="password"
                        value={patInput}
                        onChange={(e) => setPatInput(e.target.value)}
                        placeholder="ghp_... or github_pat_..."
                        className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!patInput.trim()}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Connect Token
                    </button>
                  </div>
                  <div className="text-[11px] text-neutral-500 flex items-center justify-between">
                    <span>Requires &apos;repo&apos; and &apos;gist&apos; scopes.</span>
                    <a
                      href="https://github.com/settings/tokens?type=beta"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>Generate Token on GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </form>
              </div>

              {/* Setup Helper Accordion */}
              <div className="p-3.5 rounded-lg bg-neutral-950/80 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                  <span>OAuth Callback Configuration:</span>
                  <button
                    onClick={copyCallbackUrl}
                    className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    {copiedCallback ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCallback ? 'Copied URI' : 'Copy URI'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 font-mono bg-neutral-900 p-2 rounded border border-neutral-850 break-all select-all">
                  {devCallbackUrl}
                </p>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Configure this as the &quot;Authorization callback URL&quot; in your GitHub OAuth App settings.
                </p>
              </div>
            </div>
          ) : (
            /* Connected Content Tabs */
            <>
              {activeTab === 'gist' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Export Workspace Files to Gist
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Creates a GitHub Gist containing all current code artifacts from your Code Studio session.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Gist Description</label>
                      <input
                        type="text"
                        value={gistDesc}
                        onChange={(e) => setGistDesc(e.target.value)}
                        placeholder="Description of this Gist..."
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGistPublic(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          gistPublic
                            ? 'bg-neutral-800 border-sky-400 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span>Public Gist</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGistPublic(false)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          !gistPublic
                            ? 'bg-neutral-800 border-sky-400 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Secret Gist</span>
                      </button>
                    </div>

                    {/* Files to Include */}
                    <div className="space-y-1.5">
                      <div className="text-xs text-neutral-400">
                        Included Files ({artifacts.length}):
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-neutral-800 bg-neutral-950 p-2">
                        {artifacts.length === 0 ? (
                          <div className="text-xs text-neutral-500 py-2 text-center">
                            No files in Code Studio. Generate or write code first!
                          </div>
                        ) : (
                          artifacts.map((art) => (
                            <div
                              key={art.id}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded bg-neutral-900/60 font-mono"
                            >
                              <span className="text-neutral-200">{art.filename}</span>
                              <span className="text-[10px] text-neutral-500 uppercase">{art.language}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleCreateGist}
                      disabled={isLoading || artifacts.length === 0}
                      className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-500 font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                      ) : (
                        <FileCode className="w-4 h-4" />
                      )}
                      <span>Publish Gist to GitHub</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'repo' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Create Repository & Push Code
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Creates a new GitHub repository under your profile and commits all active workspace files.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Repository Name</label>
                      <input
                        type="text"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        placeholder="e.g. task-api-service"
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Description (Optional)</label>
                      <input
                        type="text"
                        value={repoDesc}
                        onChange={(e) => setRepoDesc(e.target.value)}
                        placeholder="Repository description..."
                        className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setRepoPrivate(false)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          !repoPrivate
                            ? 'bg-neutral-800 border-sky-400 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-sky-400" />
                        <span>Public Repository</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepoPrivate(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          repoPrivate
                            ? 'bg-neutral-800 border-sky-400 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Private Repository</span>
                      </button>
                    </div>

                    <button
                      onClick={handleCreateRepo}
                      disabled={isLoading || !repoName.trim()}
                      className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-500 font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                      ) : (
                        <FolderGit2 className="w-4 h-4" />
                      )}
                      <span>Create Repository on GitHub</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'repos' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-300">
                      Recent Repositories ({repos.length})
                    </span>
                    <button
                      onClick={() => token && fetchUserRepos(token)}
                      className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {repos.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 rounded-lg border border-neutral-800 bg-neutral-950 flex items-center justify-between hover:border-neutral-700 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">{r.name}</span>
                            {r.private ? (
                              <Lock className="w-3 h-3 text-amber-400" />
                            ) : (
                              <Globe className="w-3 h-3 text-neutral-500" />
                            )}
                          </div>
                          {r.description && (
                            <p className="text-[11px] text-neutral-400 line-clamp-1">{r.description}</p>
                          )}
                        </div>

                        <a
                          href={r.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 text-[11px] text-neutral-400 hover:text-sky-300 hover:bg-neutral-900 rounded flex items-center gap-1 transition-colors"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'setup' && (
                <div className="space-y-4 text-xs text-neutral-300">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-white">OAuth App Configuration Instructions</h4>
                    <p className="text-neutral-400">
                      To enable 1-click OAuth login for yourself and team members, create a GitHub OAuth App:
                    </p>
                  </div>

                  <ol className="list-decimal pl-4 space-y-2 text-neutral-400">
                    <li>
                      Go to{' '}
                      <a
                        href="https://github.com/settings/developers"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>GitHub Developer Settings &gt; OAuth Apps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </li>
                    <li>Click <strong>&quot;New OAuth App&quot;</strong></li>
                    <li>Set <strong>Homepage URL</strong> to: <code className="bg-neutral-950 px-1.5 py-0.5 rounded text-sky-300 font-mono">{window.location.origin}</code></li>
                    <li>
                      Set <strong>Authorization callback URL</strong> to:
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-neutral-950 px-2 py-1 rounded text-sky-300 font-mono text-[11px] flex-1 break-all">
                          {devCallbackUrl}
                        </code>
                        <button
                          onClick={copyCallbackUrl}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] shrink-0"
                        >
                          {copiedCallback ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </li>
                    <li>Register the app, generate a <strong>Client Secret</strong>, and set <code className="bg-neutral-950 px-1 py-0.5 text-sky-300 font-mono">GITHUB_CLIENT_ID</code> and <code className="bg-neutral-950 px-1 py-0.5 text-sky-300 font-mono">GITHUB_CLIENT_SECRET</code> in your environment.</li>
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
