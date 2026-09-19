import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { normalizeLatex } from '@/shared/lib/latex';

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

/** Убирает непарные $ (если их нечётное количество — удаляет последний). */
function removeStrayDollars(s: string): string {
  const count = (s.match(/\$/g) || []).length;
  if (count % 2 === 0) return s;
  const idx = s.lastIndexOf('$');
  return s.slice(0, idx) + s.slice(idx + 1);
}

/** Оборачивает "голый" LaTeX в $...$ внутри одного не-долларового куска. */
function wrapBareInSegment(seg: string): string {
  const parts: string[] = [];
  let lastIdx = 0;
  const cyrRegex = /[\u0400-\u04FF]+/g;
  let m: RegExpExecArray | null;

  while ((m = cyrRegex.exec(seg)) !== null) {
    parts.push(seg.slice(lastIdx, m.index));
    parts.push(m[0]);
    lastIdx = m.index + m[0].length;
  }
  parts.push(seg.slice(lastIdx));

  return parts.map(p => {
    if (/[\u0400-\u04FF]/.test(p)) return p;              // кириллица — не трогаем
    if (!p.trim()) return p;                               // пробелы — не трогаем
    if (!/\\[a-zA-Z]+/.test(p) && !/\b(sin|cos|tan|log|ln|sqrt|abs|lim)\s*\(/.test(p)) return p;

    const lead = p.match(/^\s*/)![0];
    const trail = p.match(/\s*$/)![0];
    const core = p.trim();
    return lead + '$' + core + '$' + trail;
  }).join('');
}

/** Главная функция: сначала режем по $...$, потом внутри каждого куска — по кириллице. */
function autoWrapLatexBare(s: string): string {
  const dollarParts = s.split(/(\$[^$]+\$)/g);
  return dollarParts.map(p => {
    // Уже обёрнуто — не трогаем
    if (p.startsWith('$') && p.endsWith('$') && p.length > 2) return p;
    return wrapBareInSegment(p);
  }).join('');
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (text === null || text === undefined) return null;
  let str = String(text);
  if (!str.trim()) return null;

  // 1. @@x@@ → $x$
  str = str.replace(/@@(\w+)@@/g, (_, name) => `$${name}$`);

  // 2. Нормализация \$ и $$
  str = str.replace(/\\\$/g, '$');
  str = str.replace(/\$\$/g, '$');

  // 3. Убираем непарные $
  str = removeStrayDollars(str);

  // 4. Авто-обёртка голого LaTeX
  str = autoWrapLatexBare(str);

  // 5. Рендер
  if (str.includes('$')) {
    const segs = str.split(/(\$[^$]+\$)/g);
    return (
      <span className={className}>
        {segs.map((part, i) => {
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