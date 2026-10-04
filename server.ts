import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

export const DEV_PARTNER_SYSTEM_INSTRUCTION = `# SYSTEM PROMPT: Professional AI Programming Partner

## 1. Role & Identity
You are an expert, patient, and encouraging AI Programming Partner. Your mission is to help users build software projects, understand code logic, and debug errors effectively. You guide users through bringing their technical ideas to life step-by-step.

## 2. Core Objectives
* Complete & Functional Code: Whenever feasible, deliver complete, production-ready code that fulfills the user's goal. Avoid placeholder comments (e.g., // TODO: add code here) unless specifically requested.
* Educational Guidance: Explain the logical thought process and steps behind the code in an accessible manner.
* Actionable Instructions: Provide clear, step-by-step instructions on how to set up, build, integrate, and run the code.
* Comprehensive Documentation: Include clear inline comments explaining key logic, algorithms, and functions within every code block.

## 3. Communication Guidelines & Constraints
* Tone & Support: Maintain a positive, patient, and motivating tone at all times.
* Accessibility: Use plain, clear language suitable for beginners with foundational programming knowledge. Avoid dense jargon without explaining it first.
* Strict Domain Focus: Stay exclusively focused on software development, computer science, and technical topics. If the user introduces an off-topic subject, politely apologize and gently redirect the conversation back to programming.
* Context Retention: Preserve state and context across the entire conversation. Build logically on all prior choices, architectures, and discussions.
* Greetings & Capabilities: When greeted or asked about your capabilities, provide a brief, concise overview of your role along with 2–3 practical examples of how you can assist (e.g., writing scripts, debugging errors, explaining algorithms).

## 4. Execution Workflow
Adhere strictly to the following 3-step workflow for every coding request:

### Step 1: Requirement Gathering & Clarification
* Actively gather missing details before writing code.
* Ask concise clarifying questions regarding the target language, framework, environment, constraints, edge cases, or desired behavior to ensure complete alignment.

### Step 2: High-Level Solution Overview
* Before writing code, present a brief overview of the proposed solution.
* Outline what the code does, how it works, any key prerequisites, and potential limitations.

### Step 3: Code & Implementation
* Format code into clean, copyable markdown blocks with proper language identifiers for syntax highlighting.
* Whenever possible, indicate the target file name in the first line comment or language identifier (e.g. \`\`\`typescript // server.ts or \`\`\`python # app.py).
* Clearly explain your implementation logic and highlight key customizable variables or configuration parameters.
* Provide clear, step-by-step instructions on where to paste, configure, and execute the code.
`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini SDK with User-Agent as required by AI Studio guidelines
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.8-flash',
    });
  });

  // Chat streaming endpoint (Server-Sent Events)
  app.post('/api/chat/stream', async (req: Request, res: Response) => {
    const { messages, userProfile } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in the server environment.',
      });
      return;
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Augment system instruction if user specified preferred stack/experience
    let systemInstruction = DEV_PARTNER_SYSTEM_INSTRUCTION;
    if (userProfile) {
      const { preferredLanguage, experienceLevel, activeWorkflowStep } = userProfile;
      const extras: string[] = [];
      if (preferredLanguage) {
        extras.push(`User preferred language/stack: ${preferredLanguage}. Tailor examples and snippets accordingly unless asked otherwise.`);
      }
      if (experienceLevel) {
        extras.push(`User experience level: ${experienceLevel}. Calibrate explanations to match this background.`);
      }
      if (activeWorkflowStep) {
        extras.push(`Current user workflow focus: ${activeWorkflowStep}.`);
      }
      if (extras.length > 0) {
        systemInstruction += `\n\n### User Context & Preferences:\n${extras.join('\n')}`;
      }
    }

    // Convert messages to Gemini format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    let streamedAnyChunk = false;

    try {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          streamedAnyChunk = true;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err: unknown) {
      const error = err as Error;
      console.warn('Gemini stream status:', error.message);

      // If the SDK threw an incomplete JSON segment error at the very end of the stream,
      // but we already successfully streamed chunks, the output was safely delivered.
      if (streamedAnyChunk && (error.message?.includes('Incomplete JSON') || error.message?.includes('JSON'))) {
        console.log('Stream concluded with trailing fragment; marking stream as cleanly done.');
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      // If no chunk was streamed yet, fallback to unary generateContent
      if (!streamedAnyChunk) {
        try {
          console.log('Stream encountered issue prior to chunks; executing unary fallback...');
          const unaryResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });

          const fullText = unaryResponse.text;
          if (fullText) {
            res.write(`data: ${JSON.stringify({ text: fullText })}\n\n`);
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
            return;
          }
        } catch (unaryErr: unknown) {
          const uErr = unaryErr as Error;
          console.error('Unary fallback error:', uErr.message);
        }
      }

      res.write(
        `data: ${JSON.stringify({
          error: error.message || 'An error occurred during response generation.',
        })}\n\n`
      );
      res.end();
    }
  });

  // Dedicated single-turn endpoint for Code Explanation
  app.post('/api/code/explain', async (req: Request, res: Response) => {
    const { code, language } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Code is required' });
      return;
    }

    try {
      const prompt = `Please provide an educational, step-by-step breakdown of this ${language || 'code'} snippet:\n\`\`\`${language || ''}\n${code}\n\`\`\`\nExplain:
1. High-level purpose and architecture
2. Line-by-line or function-by-function logical walkthrough
3. Key variables, data structures, and edge cases handled
4. Time & space complexity (if algorithmic)
5. Practical tips or best practices applied`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: DEV_PARTNER_SYSTEM_INSTRUCTION,
        },
      });

      res.json({ explanation: response.text });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ error: error.message || 'Failed to explain code' });
    }
  });

  // Dedicated single-turn endpoint for Debugging / Fixing Errors
  app.post('/api/code/debug', async (req: Request, res: Response) => {
    const { code, errorLog, language } = req.body;
    if (!code && !errorLog) {
      res.status(400).json({ error: 'Code or error log is required' });
      return;
    }

    try {
      const prompt = `I need help debugging this issue in ${language || 'code'}:\n\nCode:\n\`\`\`${language || ''}\n${code || 'No code provided'}\n\`\`\`\n\nError / Symptom:\n\`\`\`\n${errorLog || 'No error log provided'}\n\`\`\`\n\nPlease:
1. Identify the root cause of the error clearly and patiently.
2. Present the high-level fix approach.
3. Provide the complete, working, production-ready corrected code with clear inline comments.
4. Give actionable instructions on how to test and verify the fix.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: DEV_PARTNER_SYSTEM_INSTRUCTION,
        },
      });

      res.json({ result: response.text });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ error: error.message || 'Failed to debug code' });
    }
  });

  // =========================================================================
  // GitHub Integration & OAuth Endpoints
  // =========================================================================

  // GitHub configuration status
  app.get('/api/github/status', (req: Request, res: Response) => {
    const isConfigured = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.json({
      configured: isConfigured,
      clientId: process.env.GITHUB_CLIENT_ID || null,
      redirectUri: `${appUrl}/auth/callback`,
      appUrl,
    });
  });

  // Construct GitHub OAuth URL (opens directly in popup as per AI Studio guidelines)
  app.get('/api/auth/github/url', (req: Request, res: Response) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      res.status(400).json({
        error: 'GITHUB_CLIENT_ID is not configured in environment variables.',
      });
      return;
    }

    const appUrl = process.env.APP_URL || (req.query.origin as string) || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${appUrl}/auth/callback`;
    const state = Math.random().toString(36).substring(2, 15);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email repo gist',
      state,
    });

    res.json({
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      redirectUri,
    });
  });

  // GitHub OAuth Callback Handler (handles trailing slash variations as required)
  app.get(['/auth/callback', '/auth/callback/'], async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).send('Authorization code is missing from OAuth callback.');
      return;
    }

    try {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'DevPartner-AI',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const data = await tokenRes.json();

      if (!tokenRes.ok || data.error) {
        res.status(400).send(`
          <html>
            <body style="font-family: sans-serif; background: #09090b; color: #f87171; padding: 2rem;">
              <h2>GitHub Authentication Failed</h2>
              <p>${data.error_description || data.error || 'Failed to exchange authorization code.'}</p>
            </body>
          </html>
        `);
        return;
      }

      const accessToken = data.access_token;

      // Render lightweight HTML that postMessages to opener and closes
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Successful</title>
          </head>
          <body style="font-family: system-ui, sans-serif; background: #09090b; color: #38bdf8; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; padding: 2rem; background: #18181b; border-radius: 12px; border: 1px solid #27272a;">
              <h3 style="color: #4ade80; margin-top: 0;">GitHub Connected Successfully!</h3>
              <p style="color: #a1a1aa; font-size: 14px;">Closing window and returning to DevPartner AI...</p>
            </div>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${accessToken}' }, '*');
                  setTimeout(() => window.close(), 600);
                } else {
                  window.location.href = '/';
                }
              } catch (e) {
                console.error(e);
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).send(`OAuth Error: ${error.message}`);
    }
  });

  // Helper to extract GitHub token from header
  const getGitHubToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    const tokenHeader = req.headers['x-github-token'];
    if (typeof tokenHeader === 'string') {
      return tokenHeader;
    }
    return null;
  };

  // Get current GitHub user info
  app.get('/api/github/user', async (req: Request, res: Response) => {
    const token = getGitHubToken(req);
    if (!token) {
      res.status(401).json({ error: 'GitHub token required' });
      return;
    }

    try {
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'DevPartner-AI',
        },
      });

      const userData = await userRes.json();
      if (!userRes.ok) {
        res.status(userRes.status).json({ error: userData.message || 'Failed to fetch user' });
        return;
      }

      res.json({
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        html_url: userData.html_url,
        public_repos: userData.public_repos,
        total_private_repos: userData.total_private_repos,
      });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ error: error.message });
    }
  });

  // Get user repositories
  app.get('/api/github/repos', async (req: Request, res: Response) => {
    const token = getGitHubToken(req);
    if (!token) {
      res.status(401).json({ error: 'GitHub token required' });
      return;
    }

    try {
      const reposRes = await fetch(
        'https://api.github.com/user/repos?sort=updated&per_page=30',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'DevPartner-AI',
          },
        }
      );

      const repos = await reposRes.json();
      if (!reposRes.ok) {
        res.status(reposRes.status).json({ error: repos.message || 'Failed to fetch repos' });
        return;
      }

      const formatted = Array.isArray(repos)
        ? repos.map((r: { id: number; name: string; full_name: string; private: boolean; html_url: string; description: string; language: string }) => ({
            id: r.id,
            name: r.name,
            full_name: r.full_name,
            private: r.private,
            html_url: r.html_url,
            description: r.description,
            language: r.language,
          }))
        : [];

      res.json({ repos: formatted });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ error: error.message });
    }
  });

  // Create GitHub Gist with workspace artifacts
  app.post('/api/github/gist', async (req: Request, res: Response) => {
    const token = getGitHubToken(req);
    if (!token) {
      res.status(401).json({ error: 'GitHub token required' });
      return;
    }

    const { description, isPublic, files } = req.body;
    if (!files || typeof files !== 'object' || Object.keys(files).length === 0) {
      res.status(400).json({ error: 'At least one file is required to create a Gist' });
      return;
    }

    // Format files for GitHub API: { "filename.ext": { "content": "..." } }
    const gistFiles: Record<string, { content: string }> = {};
    for (const [filename, content] of Object.entries(files)) {
      gistFiles[filename] = { content: String(content) };
    }

    try {
      const gistRes = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'DevPartner-AI',
        },
        body: JSON.stringify({
          description: description || 'Generated with DevPartner AI',
          public: Boolean(isPublic),
          files: gistFiles,
        }),
      });

      const data = await gistRes.json();
      if (!gistRes.ok) {
        res.status(gistRes.status).json({ error: data.message || 'Failed to create Gist' });
        return;
      }

      res.json({
        id: data.id,
        html_url: data.html_url,
        description: data.description,
        created_at: data.created_at,
      });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new GitHub repository and push initial workspace files
  app.post('/api/github/create-repo', async (req: Request, res: Response) => {
    const token = getGitHubToken(req);
    if (!token) {
      res.status(401).json({ error: 'GitHub token required' });
      return;
    }

    const { name, description, isPrivate, files } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Repository name is required' });
      return;
    }

    try {
      // 1. Create Repository
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'DevPartner-AI',
        },
        body: JSON.stringify({
          name: name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
          description: description || 'Created with DevPartner AI',
          private: Boolean(isPrivate),
          auto_init: true, // creates default branch so commits can be pushed
        }),
      });

      const repoData = await createRes.json();
      if (!createRes.ok) {
        const errorDetail = Array.isArray(repoData.errors) && repoData.errors[0]?.message
          ? `${repoData.message}: ${repoData.errors[0].message}`
          : repoData.message || 'Failed to create repo';
        res.status(createRes.status).json({ error: errorDetail });
        return;
      }

      const owner = repoData.owner.login;
      const repoName = repoData.name;

      // 2. Commit files to the repo if provided
      if (files && Array.isArray(files) && files.length > 0) {
        for (const file of files) {
          try {
            const contentBase64 = Buffer.from(file.code || '').toString('base64');
            await fetch(
              `https://api.github.com/repos/${owner}/${repoName}/contents/${file.filename}`,
              {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/vnd.github+json',
                  'Content-Type': 'application/json',
                  'User-Agent': 'DevPartner-AI',
                },
                body: JSON.stringify({
                  message: `Add ${file.filename} via DevPartner AI`,
                  content: contentBase64,
                }),
              }
            );
          } catch (fileErr) {
            console.warn(`Failed to commit file ${file.filename}:`, fileErr);
          }
        }
      }

      res.json({
        success: true,
        html_url: repoData.html_url,
        full_name: repoData.full_name,
      });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ error: error.message });
    }
  });

  // Ensure any unmatched /api/* route returns a JSON 404 instead of falling through to Vite's index.html SPA
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
  });

  // Dev vs Prod Vite mounting
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DevPartner server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
