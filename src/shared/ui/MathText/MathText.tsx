import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { normalizeLatex, cleanLatex } from '@/shared/lib/latex';

interface MathTextProps {
  text: string;
  className?: string;
}

function looksLikeMath(text: string): boolean {
  if (/[_^\\]/.test(text)) return true;
  return /\\(log|ln|sin|cos|tan|int|frac|sqrt|sum|lim|alpha|beta|gamma|pi|infty|Rightarrow|rightarrow)/.test(text)
    || /\b(log|ln|sin|cos|tan|int|frac|sqrt|sum|lim)\b/.test(text);
}

function renderKatex(latex: string): string {
  try {
    return katex.renderToString(normalizeLatex(latex), { throwOnError: false });
  } catch {
    return latex;
  }
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (text === null || text === undefined) return null;
  let str = String(text);
  if (!str.trim()) return null;

  // === НОВОЕ: @@a@@ → $a$, чтобы KaTeX отрендерил плейсхолдер как формулу ===
  str = str.replace(/@@(\w+)@@/g, (_, name) => `$${name}$`);
  // ========================================================================

  // Нормализуем \$ и $$ → $
  str = str.replace(/\\\$/g, '$');
  str = str.replace(/\$\$/g, '$');

  if (str.includes('$')) {
    const parts = str.split(/(\$[^$]+\$)/g);
    return (
      <span className={className}>
        {parts.map((part, i) => {
          if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
            const latex = part.slice(1, -1);
            return (
              <span key={i} dangerouslySetInnerHTML={{ __html: renderKatex(latex) }} />
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  }

  if (looksLikeMath(str)) {
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: renderKatex(str) }}
      />
    );
  }

  return <span className={className}>{str}</span>;
};