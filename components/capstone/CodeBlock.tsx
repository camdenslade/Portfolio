'use client';

import { useEffect, useState } from 'react';
import type { Highlighter } from 'shiki';

// VS Code's own built-in Rust syntax colors, applied client-side via Shiki
// (the same tokenizer/theme engine VS Code uses under the hood). Only the
// Rust grammar and the two default VS Code themes (dark-plus, light-plus)
// are loaded, not Shiki's full bundle, to keep this small.
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        langs: ['rust'],
        themes: ['dark-plus', 'light-plus'],
      })
    );
  }
  return highlighterPromise;
}

type CodeBlockProps = {
  code: string;
};

export function CodeBlock({ code }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHighlighter().then((highlighter) => {
      if (cancelled) return;
      const rendered = highlighter.codeToHtml(code, {
        lang: 'rust',
        themes: { light: 'light-plus', dark: 'dark-plus' },
        defaultColor: false,
      });
      setHtml(rendered);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  // Fallback: plain, unhighlighted text while Shiki loads (or if it fails),
  // so the snippet is never blank.
  if (!html) {
    return (
      <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 p-4 text-xs leading-relaxed dark:border-gray-800 dark:bg-gray-900">
        <code className="font-mono text-gray-700 dark:text-gray-300">{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="capstone-code mt-3 overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 p-4 text-xs leading-relaxed dark:border-gray-800 dark:bg-gray-900 [&_pre]:!bg-transparent [&_pre]:font-mono [&_code]:!bg-transparent"
      // Shiki's own dark/light color variants are toggled by the `.dark`
      // class further up the tree via the CSS in globals.css below.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default CodeBlock;
