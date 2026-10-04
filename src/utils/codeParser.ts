import { CodeArtifact, WorkflowStep } from '../types.ts';

/**
 * Detects default filename extension based on language identifier
 */
export function getDefaultFilename(language: string, index: number): string {
  const lang = language.toLowerCase().trim();
  switch (lang) {
    case 'typescript':
    case 'ts':
      return index === 0 ? 'index.ts' : `module_${index + 1}.ts`;
    case 'tsx':
      return index === 0 ? 'App.tsx' : `Component_${index + 1}.tsx`;
    case 'javascript':
    case 'js':
      return index === 0 ? 'index.js' : `script_${index + 1}.js`;
    case 'jsx':
      return index === 0 ? 'App.jsx' : `Component_${index + 1}.jsx`;
    case 'python':
    case 'py':
      return index === 0 ? 'main.py' : `utils_${index + 1}.py`;
    case 'html':
      return 'index.html';
    case 'css':
      return 'styles.css';
    case 'sql':
      return 'schema.sql';
    case 'json':
      return 'package.json';
    case 'bash':
    case 'sh':
    case 'shell':
      return 'run.sh';
    case 'rust':
    case 'rs':
      return 'main.rs';
    case 'go':
      return 'main.go';
    case 'cpp':
    case 'c++':
      return 'main.cpp';
    case 'c':
      return 'main.c';
    case 'java':
      return 'Main.java';
    case 'php':
      return 'index.php';
    default:
      return `file_${index + 1}.${lang || 'txt'}`;
  }
}

/**
 * Extracts filename from the first line comment if present
 */
function extractFilenameFromFirstComment(code: string): string | null {
  const firstLine = code.trim().split('\n')[0];
  if (!firstLine) return null;

  // Patterns: // filename.ext, /* filename.ext */, # filename.ext, <!-- filename.ext -->, -- filename.ext
  const match = firstLine.match(/^(?:\/\/|#|--|\/\*|<!--)\s*([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)/);
  if (match && match[1]) {
    // Sanitize path to just base filename or clean relative path
    return match[1].replace(/^\.\//, '').trim();
  }
  return null;
}

/**
 * Parses markdown text to extract all fenced code blocks as CodeArtifacts
 */
export function extractCodeArtifacts(markdown: string): CodeArtifact[] {
  const artifacts: CodeArtifact[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]+)?(?:\s+([^\n\r]+))?\n([\s\S]*?)```/g;

  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const rawLang = (match[1] || 'plaintext').trim().toLowerCase();
    const metaFilename = match[2]?.trim();
    const rawCode = match[3] || '';

    // Ignore tiny shell commands or single word echo statements from being counted as major file artifacts
    if (rawCode.trim().length === 0) continue;

    const commentFilename = extractFilenameFromFirstComment(rawCode);
    let resolvedFilename = metaFilename || commentFilename || getDefaultFilename(rawLang, index);

    // Clean up filename (strip colons, brackets, or paths)
    resolvedFilename = resolvedFilename.replace(/[:[\]()]/g, '').trim();

    artifacts.push({
      id: `artifact-${Date.now()}-${index}`,
      filename: resolvedFilename,
      language: rawLang,
      code: rawCode.trimEnd(),
      timestamp: Date.now(),
    });

    index++;
  }

  return artifacts;
}

/**
 * Analyzes text to determine the matching workflow step
 */
export function detectWorkflowStep(text: string): WorkflowStep {
  const lower = text.toLowerCase();

  // Step 1 signals
  if (
    lower.includes('step 1') ||
    lower.includes('requirement gathering') ||
    lower.includes('clarifying questions') ||
    lower.includes('clarification') ||
    (lower.includes('to clarify') && lower.includes('?')) ||
    (lower.includes('before writing code') && lower.includes('?'))
  ) {
    return 'clarification';
  }

  // Step 2 signals
  if (
    lower.includes('step 2') ||
    lower.includes('high-level solution') ||
    lower.includes('solution overview') ||
    lower.includes('how it works') ||
    lower.includes('architecture overview') ||
    (lower.includes('prerequisites') && lower.includes('limitations'))
  ) {
    return 'overview';
  }

  // Step 3 signals
  if (
    lower.includes('step 3') ||
    lower.includes('code & implementation') ||
    lower.includes('complete implementation') ||
    lower.includes('production-ready code') ||
    lower.includes('how to run') ||
    lower.includes('installation & setup')
  ) {
    return 'implementation';
  }

  return 'general';
}
