import React, { useState } from 'react';
import { Copy, Check, Play, BookOpen, ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onOpenArtifact?: (code: string, language: string, filename: string) => void;
  onRunInSandbox?: (code: string, language: string) => void;
  onExplainCode?: (code: string, language: string) => void;
}

interface ParsedSegment {
  type: 'text' | 'code';
  content: string;
  language?: string;
  filename?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onOpenArtifact,
  onRunInSandbox,
  onExplainCode,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Parse content into markdown text segments and code block segments
  const segments: ParsedSegment[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]+)?(?:\s+([^\n\r]+))?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }

    const language = (match[1] || 'text').trim().toLowerCase();
    const metaFilename = match[2]?.trim();
    const rawCode = match[3] || '';

    // Check first line comment for filename if not in fence meta
    let detectedFilename = metaFilename || '';
    if (!detectedFilename) {
      const firstLine = rawCode.trim().split('\n')[0] || '';
      const commentMatch = firstLine.match(/^(?:\/\/|#|--|\/\*|<!--)\s*([a-zA-Z0-9_\-./\\]+\.[a-zA-Z0-9]+)/);
      if (commentMatch && commentMatch[1]) {
        detectedFilename = commentMatch[1].replace(/^\.\//, '').trim();
      }
    }

    segments.push({
      type: 'code',
      language,
      filename: detectedFilename || (language === 'html' ? 'index.html' : `code.${language}`),
      content: rawCode.trimEnd(),
    });

    lastIndex = match.index + match[0].length;
  }

  // Trailing text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3 prose-code-partner">
      {segments.map((seg, i) => {
        if (seg.type === 'text') {
          return (
            <div
              key={i}
              className="text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap font-sans"
              dangerouslySetInnerHTML={{
                __html: renderInlineMarkdown(seg.content),
              }}
            />
          );
        }

        const blockId = `block-${i}`;
        const isCopied = copiedId === blockId;
        const isRunnable = ['javascript', 'js', 'html', 'typescript', 'ts', 'python', 'py'].includes(
          seg.language || ''
        );

        return (
          <div
            key={i}
            className="my-3 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900/90 text-xs shadow-md"
          >
            {/* Code Block Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-neutral-400 select-none">
              <div className="flex items-center gap-2">
                <span className="font-mono text-neutral-300 font-medium">
                  {seg.filename}
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-mono">
                  {seg.language}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {onExplainCode && (
                  <button
                    onClick={() => onExplainCode(seg.content, seg.language || '')}
                    className="px-2 py-1 text-neutral-400 hover:text-sky-300 hover:bg-neutral-800 rounded flex items-center gap-1 transition-colors"
                    title="Explain code logic step-by-step"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span className="hidden sm:inline">Explain</span>
                  </button>
                )}

                {isRunnable && onRunInSandbox && (
                  <button
                    onClick={() => onRunInSandbox(seg.content, seg.language || '')}
                    className="px-2 py-1 text-emerald-400 hover:text-emerald-300 hover:bg-neutral-800 rounded flex items-center gap-1 transition-colors"
                    title="Run code in interactive sandbox"
                  >
                    <Play className="w-3 h-3" />
                    <span className="hidden sm:inline">Run</span>
                  </button>
                )}

                {onOpenArtifact && (
                  <button
                    onClick={() =>
                      onOpenArtifact(seg.content, seg.language || '', seg.filename || '')
                    }
                    className="px-2 py-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded flex items-center gap-1 transition-colors"
                    title="Open in Workspace Studio"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="hidden sm:inline">Edit in Studio</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopy(seg.content, blockId)}
                  aria-label="Copy to Clipboard"
                  title="Copy to Clipboard for local IDE"
                  className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all text-xs font-medium ${
                    isCopied
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 shadow-sm'
                      : 'text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-750 border border-neutral-700/80 active:scale-95'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="hidden sm:inline">Copy to Clipboard</span>
                      <span className="sm:hidden">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="relative group p-3 overflow-x-auto bg-neutral-950/80">
              <pre className="font-mono text-[13px] leading-relaxed text-neutral-200">
                <code>{seg.content}</code>
              </pre>

              {/* Floating Quick Copy button on bottom-right of long code blocks */}
              <button
                onClick={() => handleCopy(seg.content, blockId)}
                aria-label="Copy to Clipboard"
                title="Copy to Clipboard"
                className={`absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 backdrop-blur-sm shadow-md ${
                  isCopied
                    ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800'
                    : 'bg-neutral-900/90 text-neutral-300 hover:text-white border border-neutral-700 hover:bg-neutral-800'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-sky-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Lightweight safe inline markdown renderer for formatting text, bold, italics, links, inline code, and lists
 */
function renderInlineMarkdown(text: string): string {
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="text-sky-300 font-semibold">$1</strong>');
  
  // Italic *text* or _text_
  escaped = escaped.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em class="text-neutral-300">$1</em>');

  // Inline code `code`
  escaped = escaped.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-sky-300 font-mono text-[12px]">$1</code>'
  );

  // Headers #, ##, ###
  escaped = escaped.replace(
    /^### (.*$)/gim,
    '<h4 class="text-sm font-semibold text-neutral-100 mt-3 mb-1.5">$1</h4>'
  );
  escaped = escaped.replace(
    /^## (.*$)/gim,
    '<h3 class="text-base font-semibold text-white mt-4 mb-2 border-b border-neutral-800 pb-1">$1</h3>'
  );
  escaped = escaped.replace(
    /^# (.*$)/gim,
    '<h2 class="text-lg font-bold text-white mt-4 mb-2">$1</h2>'
  );

  // Bullet items
  escaped = escaped.replace(
    /^[*-] (.*$)/gim,
    '<div class="flex items-start gap-2 my-1"><span class="text-sky-400 mt-1">▪</span><span>$1</span></div>'
  );

  return escaped;
}
