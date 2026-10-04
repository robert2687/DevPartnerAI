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
  GitBranch,
  GitCommit,
  Folder,
  File,
  ArrowLeft,
  DownloadCloud,
  Layers,
  Search,
} from 'lucide-react';
import { CodeArtifact, GitHubUser, GitHubRepo } from '../types.ts';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifacts: CodeArtifact[];
  activeArtifactId?: string | null;
  onImportArtifact?: (filename: string, language: string, code: string) => void;
  onImportArtifacts?: (artifacts: { filename: string; language: string; code: string }[], replaceAll?: boolean) => void;
}

function detectLang(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['ts', 'tsx'].includes(ext)) return 'typescript';
  if (['js', 'jsx'].includes(ext)) return 'javascript';
  if (ext === 'html') return 'html';
  if (ext === 'css') return 'css';
  if (ext === 'json') return 'json';
  if (ext === 'py') return 'python';
  if (ext === 'md') return 'markdown';
  if (ext === 'sql') return 'sql';
  return 'plaintext';
}

function encodeBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str || '');
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodeBase64(b64: string): string {
  const binary = atob(b64.replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  artifacts,
  activeArtifactId,
  onImportArtifact,
  onImportArtifacts,
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

  const [activeTab, setActiveTab] = useState<'sync' | 'explorer' | 'repo' | 'gist' | 'repos' | 'setup'>('sync');
  const [patInput, setPatInput] = useState<string>('');
  const [copiedCallback, setCopiedCallback] = useState<boolean>(false);

  // Sync state
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(activeArtifactId || null);
  const [syncScope, setSyncScope] = useState<'single' | 'all'>(artifacts.length > 1 ? 'all' : 'single');
  const [syncTarget, setSyncTarget] = useState<'existing' | 'new'>('existing');
  const [syncRepoName, setSyncRepoName] = useState<string>('');
  const [syncBranch, setSyncBranch] = useState<string>('main');
  const [syncCommitMsg, setSyncCommitMsg] = useState<string>('');
  const [syncFilePath, setSyncFilePath] = useState<string>('');

  // Form states
  const [gistDesc, setGistDesc] = useState<string>('DevPartner AI Code Export');
  const [gistPublic, setGistPublic] = useState<boolean>(true);
  const [repoName, setRepoName] = useState<string>('devpartner-project');
  const [repoDesc, setRepoDesc] = useState<string>('Generated with DevPartner AI');
  const [repoPrivate, setRepoPrivate] = useState<boolean>(false);

  // Repository Explorer State
  const [explorerRepoInput, setExplorerRepoInput] = useState<string>('');
  const [explorerRepo, setExplorerRepo] = useState<string>('');
  const [explorerBranch, setExplorerBranch] = useState<string>('main');
  const [explorerPath, setExplorerPath] = useState<string>('');
  const [explorerBranches, setExplorerBranches] = useState<string[]>([]);
  const [explorerContents, setExplorerContents] = useState<any[]>([]);
  const [explorerSelectedFile, setExplorerSelectedFile] = useState<{ path: string; name: string; content: string } | null>(null);
  const [isExplorerLoading, setIsExplorerLoading] = useState<boolean>(false);

  const currentArtifact =
    artifacts.find((a) => a.id === selectedArtifactId) ||
    artifacts.find((a) => a.id === activeArtifactId) ||
    artifacts[0] ||
    null;

  // Sync initial selection when artifacts or activeArtifactId change
  useEffect(() => {
    if (activeArtifactId) {
      setSelectedArtifactId(activeArtifactId);
    } else if (artifacts.length > 0 && !selectedArtifactId) {
      setSelectedArtifactId(artifacts[0].id);
    }
  }, [activeArtifactId, artifacts]);

  // Sync default file path & commit message when current artifact changes
  useEffect(() => {
    if (currentArtifact) {
      setSyncFilePath(currentArtifact.filename);
      setSyncCommitMsg(
        syncScope === 'all'
          ? `Deploy full application (${artifacts.length} files) via DevPartner AI`
          : `Sync ${currentArtifact.filename} via DevPartner AI`
      );
    }
  }, [currentArtifact?.id, currentArtifact?.filename, syncScope, artifacts.length]);

  // Sync default repo selection when repos are loaded
  useEffect(() => {
    if (repos.length > 0 && !syncRepoName) {
      setSyncRepoName(repos[0].name);
      if (!explorerRepo) {
        setExplorerRepo(repos[0].full_name);
        setExplorerRepoInput(repos[0].full_name);
      }
    }
  }, [repos]);

  const devCallbackUrl = `${window.location.origin}/auth/callback`;

  // Safe JSON fetcher that will NEVER crash with "Unexpected token '<'"
  const safeJsonFetch = async (url: string, options: RequestInit = {}): Promise<any> => {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    let data: any = null;

    if (contentType.includes('application/json') || contentType.includes('application/vnd.github')) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Request failed (${res.status} ${res.statusText || 'Error'})`);
      }
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Expected JSON but server returned ${contentType || 'HTML'}`);
      }
    }

    if (!res.ok) {
      const detailedMessage =
        Array.isArray(data?.errors) && data.errors[0]?.message
          ? `${data.message}: ${data.errors[0].message}`
          : data?.error || data?.message || `Request failed with status ${res.status}`;
      throw new Error(detailedMessage);
    }

    return data;
  };

  // Fetch GitHub User Profile
  const fetchUserProfile = async (authToken: string) => {
    try {
      const data = await safeJsonFetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/vnd.github+json',
        },
      });
      setUser(data);
      return data;
    } catch {
      return null;
    }
  };

  // Fetch User Repositories
  const fetchUserRepos = async (authToken: string) => {
    try {
      const data = await safeJsonFetch('https://api.github.com/user/repos?sort=updated&per_page=30', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/vnd.github+json',
        },
      });
      if (Array.isArray(data)) {
        setRepos(data);
        if (data.length > 0 && !syncRepoName) {
          setSyncRepoName(data[0].name);
        }
      }
    } catch (err: unknown) {
      console.warn('Could not fetch user repos:', err);
    }
  };

  // Check Token on Mount
  useEffect(() => {
    if (token && isOpen) {
      fetchUserProfile(token);
      fetchUserRepos(token);
    }
  }, [token, isOpen]);

  // Connect via OAuth
  const handleOAuthConnect = async () => {
    setIsLoading(true);
    setError(null);

    const redirectUri = `${window.location.origin}/auth/callback`;
    const popup = window.open(
      `/api/github/login?redirect_uri=${encodeURIComponent(redirectUri)}`,
      'GitHub OAuth Login',
      'width=600,height=750,menubar=no,status=no'
    );

    const messageListener = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const receivedToken = event.data.token;
        if (receivedToken) {
          setToken(receivedToken);
          localStorage.setItem('devpartner_gh_token', receivedToken);
          await fetchUserProfile(receivedToken);
          await fetchUserRepos(receivedToken);
          setSuccessMessage('Successfully connected to GitHub!');
        }
        window.removeEventListener('message', messageListener);
        setIsLoading(false);
      } else if (event.data?.type === 'GITHUB_AUTH_ERROR') {
        setError(event.data.error || 'Authentication failed');
        window.removeEventListener('message', messageListener);
        setIsLoading(false);
      }
    };

    window.addEventListener('message', messageListener);

    const checkClosedInterval = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosedInterval);
        setIsLoading(false);
      }
    }, 1000);
  };

  // Connect via PAT
  const handlePatConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patInput.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const userData = await fetchUserProfile(patInput.trim());
      if (userData) {
        setToken(patInput.trim());
        localStorage.setItem('devpartner_gh_token', patInput.trim());
        await fetchUserRepos(patInput.trim());
        setSuccessMessage(`Connected as ${userData.name || userData.login}!`);
        setPatInput('');
      } else {
        setError('Invalid token or insufficient scopes.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect
  const handleDisconnect = () => {
    localStorage.removeItem('devpartner_gh_token');
    setToken('');
    setUser(null);
    setRepos([]);
    setError(null);
    setSuccessMessage(null);
    setCreatedUrl(null);
  };

  // Load Repository Explorer Tree
  const loadRepoExplorer = async (repoFullName: string, path = '', branch?: string) => {
    const cleanRepo = repoFullName.trim();
    if (!cleanRepo) return;

    setIsExplorerLoading(true);
    setExplorerSelectedFile(null);
    setError(null);

    const targetBranch = branch || explorerBranch || 'main';

    try {
      // Fetch branches if repo changed
      if (explorerRepo !== cleanRepo || explorerBranches.length === 0) {
        try {
          const branches = await safeJsonFetch(`https://api.github.com/repos/${cleanRepo}/branches`, {
            headers: token
              ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
              : { Accept: 'application/vnd.github+json' },
          });
          if (Array.isArray(branches)) {
            setExplorerBranches(branches.map((b) => b.name));
          }
        } catch (e) {
          console.warn('Could not fetch branches:', e);
        }
      }

      // Fetch folder contents
      const url = `https://api.github.com/repos/${cleanRepo}/contents/${path}${
        targetBranch ? `?ref=${targetBranch}` : ''
      }`;
      const contents = await safeJsonFetch(url, {
        headers: token
          ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
          : { Accept: 'application/vnd.github+json' },
      });

      if (Array.isArray(contents)) {
        setExplorerContents(contents);
        setExplorerPath(path);
        setExplorerRepo(cleanRepo);
        if (branch) setExplorerBranch(branch);
      } else if (contents && contents.type === 'file') {
        const decoded = decodeBase64(contents.content);
        setExplorerSelectedFile({
          path: contents.path,
          name: contents.name,
          content: decoded,
        });
      }
    } catch (err: any) {
      setError(`Failed to inspect repository: ${err.message}`);
    } finally {
      setIsExplorerLoading(false);
    }
  };

  // Import single file from explorer to Code Studio
  const handleImportExplorerFile = () => {
    if (!explorerSelectedFile) return;
    const lang = detectLang(explorerSelectedFile.name);

    if (onImportArtifacts) {
      onImportArtifacts([
        {
          filename: explorerSelectedFile.name,
          language: lang,
          code: explorerSelectedFile.content,
        },
      ]);
    } else if (onImportArtifact) {
      onImportArtifact(explorerSelectedFile.name, lang, explorerSelectedFile.content);
    }
    setSuccessMessage(`Imported '${explorerSelectedFile.name}' into Code Studio!`);
  };

  // Clone / Import full repository folder into Code Studio
  const handleCloneFullRepo = async () => {
    if (!explorerRepo) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const fileItems = explorerContents.filter((c) => c.type === 'file');
      if (fileItems.length === 0) {
        throw new Error('No files found in current directory to import.');
      }

      const importedList: { filename: string; language: string; code: string }[] = [];

      for (const item of fileItems.slice(0, 20)) {
        try {
          const itemData = await safeJsonFetch(item.url, {
            headers: token
              ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
              : { Accept: 'application/vnd.github+json' },
          });
          if (itemData.content) {
            const code = decodeBase64(itemData.content);
            importedList.push({
              filename: item.name,
              language: detectLang(item.name),
              code,
            });
          }
        } catch (itemErr) {
          console.warn(`Failed to fetch file ${item.name}:`, itemErr);
        }
      }

      if (importedList.length > 0) {
        if (onImportArtifacts) {
          onImportArtifacts(importedList, true);
        } else if (onImportArtifact) {
          importedList.forEach((f) => onImportArtifact(f.filename, f.language, f.code));
        }
        setSuccessMessage(`Successfully connected & imported ${importedList.length} files from ${explorerRepo}!`);
        onClose();
      }
    } catch (err: any) {
      setError(`Failed to clone repository: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Publish Gist
  const handleCreateGist = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setCreatedUrl(null);

    const filesPayload: Record<string, { content: string }> = {};
    artifacts.forEach((art) => {
      filesPayload[art.filename] = { content: art.code || '' };
    });

    try {
      const data = await safeJsonFetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: gistDesc || 'Generated with DevPartner AI',
          public: Boolean(gistPublic),
          files: filesPayload,
        }),
      });

      setSuccessMessage('GitHub Gist successfully created!');
      setCreatedUrl(data.html_url);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync / Push CodeArtifact(s) to GitHub (Single or Full Application)
  const handleSyncWithGitHub = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setCreatedUrl(null);

    const filesToSync =
      syncScope === 'all'
        ? artifacts
        : currentArtifact
        ? [currentArtifact]
        : [];

    if (filesToSync.length === 0) {
      setError('No files available to push. Create or select a file in Code Studio.');
      setIsLoading(false);
      return;
    }

    try {
      if (syncTarget === 'new') {
        // 1. Create a brand new repository
        const cleanRepoName = repoName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        if (!cleanRepoName) {
          throw new Error('Please enter a valid repository name.');
        }

        const newRepoData = await safeJsonFetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: cleanRepoName,
            description: repoDesc || 'Created with DevPartner AI',
            private: Boolean(repoPrivate),
            auto_init: true,
          }),
        });

        const owner = newRepoData.owner.login;
        const targetRepo = newRepoData.name;
        const targetBranch = newRepoData.default_branch || 'main';

        // Push all files
        for (const file of filesToSync) {
          const contentBase64 = encodeBase64(file.code || '');
          await safeJsonFetch(
            `https://api.github.com/repos/${owner}/${targetRepo}/contents/${file.filename}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: `Deploy ${file.filename} via DevPartner AI`,
                content: contentBase64,
                branch: targetBranch,
              }),
            }
          );
        }

        setSuccessMessage(
          `Created repository '${newRepoData.full_name}' and deployed full application (${filesToSync.length} files)!`
        );
        setCreatedUrl(newRepoData.html_url);
        fetchUserRepos(token);
      } else {
        // 2. Sync to an existing repository & branch
        const targetRepoName = syncRepoName.trim();
        if (!targetRepoName) {
          throw new Error('Please select or specify a target repository.');
        }

        const branch = syncBranch.trim() || 'main';
        const owner = user?.login;

        if (!owner) {
          throw new Error('GitHub profile not loaded. Please reconnect your account.');
        }

        let syncedCount = 0;

        for (const file of filesToSync) {
          const filePath =
            syncScope === 'single' && syncFilePath.trim()
              ? syncFilePath.trim()
              : file.filename;

          let existingSha: string | undefined;
          try {
            const fileInfo = await safeJsonFetch(
              `https://api.github.com/repos/${owner}/${targetRepoName}/contents/${filePath}?ref=${branch}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/vnd.github+json',
                },
              }
            );
            if (fileInfo?.sha) existingSha = fileInfo.sha;
          } catch {
            // New file
          }

          const contentBase64 = encodeBase64(file.code || '');
          const putBody: any = {
            message: syncCommitMsg.trim() || `Sync ${filePath} via DevPartner AI`,
            content: contentBase64,
            branch: branch,
          };
          if (existingSha) putBody.sha = existingSha;

          await safeJsonFetch(
            `https://api.github.com/repos/${owner}/${targetRepoName}/contents/${filePath}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(putBody),
            }
          );
          syncedCount++;
        }

        setSuccessMessage(
          `Successfully synced ${syncedCount} file${syncedCount > 1 ? 's' : ''} to ${owner}/${targetRepoName} on branch '${branch}'!`
        );
        setCreatedUrl(`https://github.com/${owner}/${targetRepoName}/tree/${branch}`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message.includes('already exists')) {
        setError('A repository with that name already exists. Please choose a different name.');
      } else {
        setError(error.message);
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in select-none">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-neutral-950 border border-neutral-700 flex items-center justify-center text-white">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">GitHub Integration & Repository Explorer</h2>
              <p className="text-[11px] text-neutral-400">
                Connect to existing repositories, browse file trees, import full codebases, and push full applications
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
          <div className="flex items-center px-5 border-b border-neutral-800 bg-neutral-900/60 text-xs gap-3 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('sync');
                setError(null);
                setSuccessMessage(null);
                setCreatedUrl(null);
              }}
              className={`py-2.5 border-b-2 font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'sync'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Sync & Push</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('explorer');
                setError(null);
                setSuccessMessage(null);
                setCreatedUrl(null);
                if (repos.length > 0 && !explorerRepo) {
                  loadRepoExplorer(repos[0].full_name);
                }
              }}
              className={`py-2.5 border-b-2 font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'explorer'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Connect to Repositories</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('gist');
                setError(null);
                setSuccessMessage(null);
                setCreatedUrl(null);
              }}
              className={`py-2.5 border-b-2 font-medium transition-colors shrink-0 ${
                activeTab === 'gist'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Publish to Gist
            </button>

            <button
              onClick={() => {
                setActiveTab('repos');
                setError(null);
                setSuccessMessage(null);
                setCreatedUrl(null);
              }}
              className={`py-2.5 border-b-2 font-medium transition-colors shrink-0 ${
                activeTab === 'repos'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              My Repositories ({repos.length})
            </button>

            <button
              onClick={() => setActiveTab('setup')}
              className={`py-2.5 border-b-2 font-medium transition-colors ml-auto shrink-0 ${
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
                  Authenticate with GitHub to explore repositories, import existing codebases directly into Code Studio, and publish full applications.
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
              {/* TAB 1: SYNC & PUSH (SINGLE FILE OR FULL APP) */}
              {activeTab === 'sync' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5 text-sky-400" />
                      <span>Sync & Push to GitHub</span>
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Commit and push your files to an existing repository branch or create a brand new repository.
                    </p>
                  </div>

                  {/* Scope Selector: Single File vs Full Application */}
                  <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-300">What to Push:</span>
                      <div className="flex items-center gap-1 p-0.5 rounded bg-neutral-900 border border-neutral-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setSyncScope('all')}
                          className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                            syncScope === 'all'
                              ? 'bg-sky-500 text-neutral-950 font-semibold shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Full Application ({artifacts.length} files)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSyncScope('single')}
                          className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                            syncScope === 'single'
                              ? 'bg-neutral-800 text-white font-medium shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>Single File</span>
                        </button>
                      </div>
                    </div>

                    {syncScope === 'single' ? (
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-850">
                        <span className="text-xs text-neutral-400">Select file:</span>
                        {artifacts.length > 1 ? (
                          <select
                            value={currentArtifact?.id || ''}
                            onChange={(e) => setSelectedArtifactId(e.target.value)}
                            className="bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 rounded px-2.5 py-1 font-mono focus:outline-none focus:border-sky-500"
                          >
                            {artifacts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.filename} ({a.language})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-mono text-white">{currentArtifact?.filename}</span>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-neutral-850 flex flex-wrap gap-1.5">
                        {artifacts.map((a) => (
                          <span
                            key={a.id}
                            className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300"
                          >
                            {a.filename}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Destination: Existing Repository vs New Repository */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-neutral-300">Destination:</label>
                      <div className="flex items-center gap-1 p-0.5 rounded bg-neutral-950 border border-neutral-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setSyncTarget('existing')}
                          className={`px-3 py-1 rounded transition-colors ${
                            syncTarget === 'existing'
                              ? 'bg-neutral-800 text-white font-medium shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Existing Repository
                        </button>
                        <button
                          type="button"
                          onClick={() => setSyncTarget('new')}
                          className={`px-3 py-1 rounded transition-colors ${
                            syncTarget === 'new'
                              ? 'bg-neutral-800 text-white font-medium shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          New Repository
                        </button>
                      </div>
                    </div>

                    {syncTarget === 'existing' ? (
                      <div className="space-y-3 p-3.5 rounded-lg bg-neutral-950/70 border border-neutral-800">
                        <div className="space-y-1">
                          <label className="text-xs text-neutral-400">Target Repository</label>
                          {repos.length > 0 ? (
                            <div className="flex gap-2">
                              <select
                                value={syncRepoName}
                                onChange={(e) => setSyncRepoName(e.target.value)}
                                className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                              >
                                {repos.map((r) => (
                                  <option key={r.id} value={r.name}>
                                    {r.name} {r.private ? '(private)' : ''}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={syncRepoName}
                                onChange={(e) => setSyncRepoName(e.target.value)}
                                placeholder="Or enter repo name"
                                className="w-40 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500 font-mono"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={syncRepoName}
                              onChange={(e) => setSyncRepoName(e.target.value)}
                              placeholder="Repository name (e.g. my-app)"
                              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500 font-mono"
                            />
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs text-neutral-400 flex items-center gap-1">
                              <GitBranch className="w-3 h-3 text-sky-400" />
                              <span>Target Branch</span>
                            </label>
                            <input
                              type="text"
                              value={syncBranch}
                              onChange={(e) => setSyncBranch(e.target.value)}
                              placeholder="main"
                              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs text-neutral-400">Target Path</label>
                            <input
                              type="text"
                              disabled={syncScope === 'all'}
                              value={syncScope === 'all' ? 'Root directory (multi-file)' : syncFilePath}
                              onChange={(e) => setSyncFilePath(e.target.value)}
                              placeholder="filename.ext"
                              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500 font-mono disabled:opacity-60"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-neutral-400">Commit Message</label>
                          <input
                            type="text"
                            value={syncCommitMsg}
                            onChange={(e) => setSyncCommitMsg(e.target.value)}
                            placeholder="Commit message..."
                            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3.5 rounded-lg bg-neutral-950/70 border border-neutral-800">
                        <div className="space-y-1">
                          <label className="text-xs text-neutral-400">New Repository Name</label>
                          <input
                            type="text"
                            value={repoName}
                            onChange={(e) => setRepoName(e.target.value)}
                            placeholder="my-new-app"
                            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-neutral-400">Description (Optional)</label>
                          <input
                            type="text"
                            value={repoDesc}
                            onChange={(e) => setRepoDesc(e.target.value)}
                            placeholder="Full application generated with DevPartner AI"
                            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setRepoPrivate(false)}
                            className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                              !repoPrivate
                                ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Public Repository</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRepoPrivate(true)}
                            className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                              repoPrivate
                                ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Private Repository</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSyncWithGitHub}
                    disabled={isLoading || !token || (syncTarget === 'existing' && !syncRepoName.trim()) || (syncTarget === 'new' && !repoName.trim())}
                    className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-500 font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-md active:scale-98"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                        <span>Pushing to GitHub...</span>
                      </>
                    ) : (
                      <>
                        <GitCommit className="w-4 h-4" />
                        <span>{syncScope === 'all' ? `Push Full Application (${artifacts.length} Files)` : 'Sync File with GitHub'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* TAB 2: REPOSITORY EXPLORER & CODEBASE IMPORTER */}
              {activeTab === 'explorer' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Connect to GitHub Repositories</span>
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Explore repository branches, inspect directories, and import existing codebases directly into Code Studio.
                    </p>
                  </div>

                  {/* Connect / Select Repo Bar */}
                  <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-wrap gap-2 items-center">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={explorerRepoInput}
                        onChange={(e) => setExplorerRepoInput(e.target.value)}
                        placeholder="owner/repo (e.g. facebook/react or your-repo)"
                        className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>

                    {explorerBranches.length > 0 && (
                      <select
                        value={explorerBranch}
                        onChange={(e) => {
                          setExplorerBranch(e.target.value);
                          loadRepoExplorer(explorerRepoInput, '', e.target.value);
                        }}
                        className="px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-200 font-mono focus:outline-none focus:border-sky-500"
                      >
                        {explorerBranches.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={() => loadRepoExplorer(explorerRepoInput)}
                      disabled={isExplorerLoading || !explorerRepoInput.trim()}
                      className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-neutral-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {isExplorerLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Connect Repo</span>
                    </button>
                  </div>

                  {/* Breadcrumb Path Trail */}
                  {explorerRepo && (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 py-1 overflow-x-auto">
                      <button
                        onClick={() => loadRepoExplorer(explorerRepo, '')}
                        className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <FolderGit2 className="w-3 h-3" />
                        <span>{explorerRepo}</span>
                      </button>
                      {explorerPath && (
                        <>
                          <span>/</span>
                          <span className="text-white">{explorerPath}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Explorer Split View (File Tree & Preview) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden min-h-[260px] max-h-[360px]">
                    {/* Left: Directory File List */}
                    <div className="md:col-span-5 border-r border-neutral-800 p-2 overflow-y-auto space-y-1">
                      {isExplorerLoading ? (
                        <div className="p-8 text-center text-xs text-neutral-500 flex flex-col items-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
                          <span>Fetching repository contents...</span>
                        </div>
                      ) : explorerContents.length === 0 ? (
                        <div className="p-8 text-center text-xs text-neutral-500">
                          Connect to a repository above to explore files.
                        </div>
                      ) : (
                        <>
                          {explorerPath && (
                            <button
                              onClick={() => {
                                const parts = explorerPath.split('/');
                                parts.pop();
                                loadRepoExplorer(explorerRepo, parts.join('/'));
                              }}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-neutral-900 text-xs font-mono text-neutral-400 flex items-center gap-2 transition-colors"
                            >
                              <ArrowLeft className="w-3 h-3 text-neutral-500" />
                              <span>.. (Back)</span>
                            </button>
                          )}

                          {explorerContents.map((item) => (
                            <div
                              key={item.sha || item.path}
                              onClick={() => {
                                if (item.type === 'dir') {
                                  loadRepoExplorer(explorerRepo, item.path);
                                } else {
                                  loadRepoExplorer(explorerRepo, item.path);
                                }
                              }}
                              className={`px-2 py-1.5 rounded text-xs font-mono flex items-center justify-between cursor-pointer transition-colors ${
                                explorerSelectedFile?.path === item.path
                                  ? 'bg-neutral-800 text-white font-medium'
                                  : 'text-neutral-300 hover:bg-neutral-900'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {item.type === 'dir' ? (
                                  <Folder className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                ) : (
                                  <File className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                )}
                                <span className="truncate">{item.name}</span>
                              </div>
                              {item.size ? (
                                <span className="text-[10px] text-neutral-500 tabular-nums">
                                  {Math.round(item.size / 1024)}k
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Right: Selected File Inspector & Actions */}
                    <div className="md:col-span-7 flex flex-col overflow-hidden bg-neutral-900/40">
                      {explorerSelectedFile ? (
                        <>
                          <div className="px-3 py-2 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
                            <span className="text-xs font-mono text-white truncate">
                              {explorerSelectedFile.name}
                            </span>
                            <button
                              onClick={handleImportExplorerFile}
                              className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-neutral-950 text-xs font-semibold flex items-center gap-1 transition-all"
                            >
                              <DownloadCloud className="w-3 h-3" />
                              <span>Import File</span>
                            </button>
                          </div>
                          <div className="flex-1 p-3 overflow-auto font-mono text-xs text-neutral-300 select-text leading-relaxed">
                            <pre className="whitespace-pre-wrap">{explorerSelectedFile.content}</pre>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500 text-xs">
                          <FileCode className="w-8 h-8 mb-2 stroke-1 text-neutral-600" />
                          <span>Select any file in the tree to inspect code and import.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Batch Action: Clone/Import All Files */}
                  {explorerContents.length > 0 && (
                    <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-white">Import Entire Codebase</h4>
                        <p className="text-[11px] text-neutral-400">
                          Imports all files in the current repository folder directly into Code Studio.
                        </p>
                      </div>
                      <button
                        onClick={handleCloneFullRepo}
                        disabled={isLoading}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-medium text-xs flex items-center gap-1.5 transition-colors border border-neutral-700"
                      >
                        <DownloadCloud className="w-3.5 h-3.5 text-sky-400" />
                        <span>Import All Files</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CREATE REPO */}
              {activeTab === 'repo' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Create New GitHub Repository
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Creates a new remote repository under your connected account and initializes it with your active Code Studio application.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Repository Name</label>
                      <input
                        type="text"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        placeholder="my-new-repo"
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
                      onClick={handleSyncWithGitHub}
                      disabled={isLoading || !repoName.trim()}
                      className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-500 font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-neutral-950" />
                      ) : (
                        <FolderGit2 className="w-4 h-4" />
                      )}
                      <span>Create Repository & Push Application</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: GIST */}
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
                      <span>Publish {artifacts.length} Files to Gist</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: REPOS */}
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

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setExplorerRepo(r.full_name);
                              setExplorerRepoInput(r.full_name);
                              setActiveTab('explorer');
                              loadRepoExplorer(r.full_name);
                            }}
                            className="px-2 py-1 text-[11px] text-sky-400 hover:text-sky-300 hover:bg-neutral-900 border border-neutral-800 rounded flex items-center gap-1 transition-colors"
                            title={`Browse files in ${r.name}`}
                          >
                            <FolderGit2 className="w-3 h-3" />
                            <span>Browse</span>
                          </button>

                          <a
                            href={r.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 rounded flex items-center gap-1 transition-colors"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: SETUP */}
              {activeTab === 'setup' && (
                <div className="space-y-4 text-xs text-neutral-300">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                      OAuth App Configuration
                    </h3>
                    <p className="text-neutral-400">
                      Configure your self-hosted GitHub OAuth credentials in environment variables for zero-friction sign-in.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="text-[11px] font-semibold text-neutral-400">Environment Variables (.env):</div>
                    <pre className="bg-neutral-900 p-2.5 rounded font-mono text-[11px] text-sky-400">
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
