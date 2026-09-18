import React from 'react';
import hljs from 'highlight.js';
import { MathText } from '@shared/ui/MathText';
import 'highlight.js/styles/github-dark.css';

interface RichTextProps {
  text: string;
  className?: string;
  /** Если true, кодовые блоки рендерятся светлым фоном (для админки) */
  light?: boolean;
}

// Признаки того, что текст — Python-код
function looksLikePython(text: string): boolean {
  if (!text) return false;
  const hasNewlines = text.includes('\n');
  const hasKeywords = /(^|\s|\n)(def|class|if|elif|else|for|while|return|import|from|print|lambda|try|except|finally|with|yield|async|await)\b/.test(text);
  const hasPythonSyntax = /:\s*$|=\s*[^=]|\bprint\s*\(|\brange\s*\(|self\./.test(text);
  return (hasNewlines && hasKeywords) || (hasKeywords && hasPythonSyntax);
}

// Рендер блока кода как "компилятор"
const CodeBlock: React.FC<{ code: string; light?: boolean }> = ({ code, light }) => {
  const html = React.useMemo(() => {
    try {
      return hljs.highlight(code, { language: 'python' }).value;
    } catch {
      return code;
    }
  }, [code]);

  if (light) {
    return (
      <div className="rounded-lg overflow-hidden border border-gray-200 my-3">
        <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-1.5 border-b border-gray-200">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-[10px] text-gray-500 font-mono uppercase">python</span>
        </div>
        <pre className="bg-gray-50 p-3 m-0 overflow-x-auto text-sm">
          <code
            className="language-python font-mono"
            style={{ color: '#24292e' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </pre>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-800 my-3">
      <div className="bg-gray-800 px-3 py-2 flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="ml-2 text-xs text-gray-400 font-mono">python</span>
      </div>
      <pre className="bg-gray-900 p-4 m-0 overflow-x-auto">
        <code
          className="language-python text-sm"
          style={{ color: '#f8f8f2' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
};

export const RichText: React.FC<RichTextProps> = ({ text, className = '', light = false }) => {
  if (text === null || text === undefined) return null;
  const str = String(text);
  if (!str.trim()) return null;

  // 1. Разбираем на части: код ```python ... ```, формулы $...$, обычный текст
  const parts: Array<{ type: 'text' | 'code' | 'inline-code'; value: string }> = [];

  // Сначала вытащим блоки ```...```
  const codeBlockRegex = /```(?:python|py)?\s*\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: str.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', value: match[1].replace(/\n$/, '') });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < str.length) {
    parts.push({ type: 'text', value: str.slice(lastIndex) });
  }

  // Если ни одного блока не нашли, но весь текст похож на Python-код — рендерим целиком как код
  if (parts.length === 1 && parts[0].type === 'text' && looksLikePython(parts[0].value)) {
    return (
      <div className={className}>
        <CodeBlock code={parts[0].value} light={light} />
      </div>
    );
  }

  // 2. Обычный текст — прогоняем через MathText (KaTeX + $...$)
  return (
    <div className={className}>
      {parts.map((p, i) => {
        if (p.type === 'code') {
          return <CodeBlock key={i} code={p.value} light={light} />;
        }
        // Рендерим текстовую часть. MathText сам разберётся с $...$
        // Сохраняем переносы строк через whitespace-pre-wrap
        return (
          <span key={i} className="whitespace-pre-wrap">
            <MathText text={p.value} />
          </span>
        );
      })}
    </div>
  );
};