const express = require('express');
const axios = require('axios');
const router = express.Router();
const AiGeneration = require('../models/AiGeneration');

// ============================================================
// СПРАВОЧНИК ЭКЗАМЕНОВ
// ============================================================
const EXAM_KNOWLEDGE = {
  ege_math_profile: `ЕГЭ математика профиль.
Ч1 (1–12): планиметрия, векторы, стереометрия, вероятность, уравнения, производная, графики, экстремумы.
Ч2 (13–19): тригонометрия с отбором, стереометрия-доказательство, неравенства с ОДЗ, экономическая, планиметрия, параметр, делимость.`,

  ege_math_base: `ЕГЭ математика база. Задания 1–21: вычисления, проценты, уравнения, неравенства, функции, геометрия, вероятность, логика.`,

  oge_math: `ОГЭ математика. Ч1 (1–20) + Ч2 (21–26): алгебра, геометрия, реальная математика.`,

  ege_python: `ЕГЭ информатика (Python). Ч1 (1–10) + Ч2 (24–27).`,

  ege_russian: `ЕГЭ по русскому языку (задания 1–26 с коротким ответом).
4: ударение (орфоэпия)
5: паронимы
6: лексические нормы
7: морфологические нормы
8: синтаксические нормы
9–15: орфография
16–21: пунктуация
22–26: анализ текста`,

  oge_russian: `ОГЭ по русскому языку (задания 2–8 с коротким ответом).`,
};

function detectExam(topic) {
  const t = topic.toLowerCase();
  if (/(егэ|ege)/.test(t) && /(информат|python|питон)/.test(t)) return 'ege_python';
  if (/(егэ|ege)/.test(t) && /(базов|база)/.test(t)) return 'ege_math_base';
  if (/(егэ|ege)/.test(t) && /(матем|math|профил)/.test(t)) return 'ege_math_profile';
  if (/(егэ|ege)/.test(t) && /(русск|russian|литератур)/.test(t)) return 'ege_russian';
  if (/(огэ|oge)/.test(t) && /(русск|russian)/.test(t)) return 'oge_russian';
  if (/(огэ|oge)/.test(t)) return 'oge_math';
  if (/(егэ|ege)/.test(t)) return 'ege_math_profile';
  return null;
}

// ============================================================
// LATEX-КОМАНДЫ
// ============================================================
const LATEX_WORDS = new Set([
  'alpha','beta','gamma','delta','epsilon','varepsilon','zeta','eta',
  'theta','vartheta','iota','kappa','lambda','mu','nu','xi',
  'omicron','pi','varpi','rho','varrho','sigma','varsigma','tau',
  'upsilon','phi','varphi','chi','psi','omega',
  'Gamma','Delta','Theta','Lambda','Xi','Pi','Sigma','Upsilon',
  'Phi','Psi','Omega',
  'frac','sqrt','sum','prod','int','iint','iiint','oint',
  'lim','log','ln','lg','sin','cos','tan','cot','sec','csc',
  'arcsin','arccos','arctan','sinh','cosh','tanh','coth',
  'cdot','times','div','pm','mp','ast','star','circ','bullet',
  'le','leq','ge','geq','ne','neq','equiv','approx','sim','simeq',
  'propto','parallel','perp','cong',
  'infty','partial','nabla','forall','exists','emptyset','varnothing',
  'rightarrow','leftarrow','leftrightarrow','Rightarrow','Leftarrow',
  'Leftrightarrow','to','mapsto','uparrow','downarrow',
  'left','right','big','Big','bigg','Bigg','langle','rangle',
  'vec','bar','hat','tilde','dot','ddot','overline','underline',
  'text','mathrm','mathbf','mathit','mathbb','mathcal','mathfrak',
  'operatorname','begin','end','hline','quad','qquad','ce','pu',
]);

function extractLatexWord(str, from) {
  let j = from, word = '';
  while (j < str.length && /[a-zA-Z]/.test(str[j]) && word.length < 20) {
    word += str[j]; j++;
  }
  return word;
}

function isLatexCommand(str, i) {
  const w = extractLatexWord(str, i + 1);
  return w.length > 0 && LATEX_WORDS.has(w);
}

function fixJsonEscapes(str) {
  let result = '', i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch !== '\\') { result += ch; i++; continue; }
    const next = str[i + 1];
    if (next === undefined) { result += '\\\\'; i++; continue; }
    if (next === '"' || next === '\\' || next === '/') { result += ch + next; i += 2; continue; }
    if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(str.slice(i + 2, i + 6))) {
      result += str.slice(i, i + 6); i += 6; continue;
    }
    if (isLatexCommand(str, i)) { result += '\\\\'; i++; continue; }
    result += ch + next; i += 2;
  }
  return result;
}

function parseAiResponse(aiText) {
  let jsonString = aiText
    .replace(/^```json\s*\n?/i, '')
    .replace(/^```\s*\n?/i, '')
    .replace(/\n?```$/, '');
  try {
    return JSON.parse(fixJsonEscapes(jsonString));
  } catch (e) {
    const a = aiText.indexOf('{');
    const b = aiText.lastIndexOf('}');
    if (a !== -1 && b !== -1 && b > a) {
      return JSON.parse(fixJsonEscapes(aiText.substring(a, b + 1)));
    }
    throw new Error('Не удалось извлечь JSON: ' + e.message);
  }
}

// ============================================================
// ОПРЕДЕЛЕНИЕ ТИПА ЗАДАНИЯ ДЛЯ РУССКОГО
// ============================================================
function detectRussianType(topic) {
  const t = String(topic || '').toLowerCase();
  if (/ударени|орфоэпи/i.test(t)) return 'stress';
  if (/орфограф|правопис|букв[аеуыо]|пропуск|корн[еия]|приставк|суффикс/i.test(t)) return 'orthography';
  if (/пунктуац|запят|тире|двоеточи|знак препинан/i.test(t)) return 'punctuation';
  if (/пароним/i.test(t)) return 'paronym';
  if (/морфолог|форм[аы] слов|часть речи/i.test(t)) return 'morphology';
  if (/синтаксис|согласован|управлен|грамматическ/i.test(t)) return 'syntax';
  if (/лексик|значени[ея] слов|фразеолог/i.test(t)) return 'lexis';
  if (/выразительн|троп|метафор|эпитет|олицетвор/i.test(t)) return 'expressiveness';
  return 'generic';
}

// ============================================================
// ДУБЛИКАТЫ
// ============================================================
function deduplicateQuestions(testData) {
  if (!testData.questions) return testData;
  const seen = new Set(), unique = [];
  testData.questions.forEach(q => {
    const key = (q.questionText || '').trim().toLowerCase();
    if (!key || !seen.has(key)) {
      if (key) seen.add(key);
      unique.push(q);
    }
  });
  if (unique.length !== testData.questions.length) {
    console.warn(`⚠️  Удалено дубликатов: ${testData.questions.length - unique.length}`);
  }
  testData.questions = unique;
  return testData;
}

function removeExpressionBuilderForRussian(testData, isRussian) {
  if (!isRussian || !testData?.questions) return testData;
  const before = testData.questions.length;
  testData.questions = testData.questions.filter(q => q.type !== 'expressionBuilder');
  if (before !== testData.questions.length) {
    console.warn(`⚠️  Удалено expressionBuilder для русского: ${before - testData.questions.length}`);
  }
  return testData;
}

// ============================================================
// НОРМАЛИЗАЦИЯ
// ============================================================
function normalizeTypes(testData) {
  if (!testData?.questions || !Array.isArray(testData.questions)) return testData;

  const pick = (obj, keys, fallback = '') => {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
        return String(obj[k]);
      }
    }
    return fallback;
  };

  testData.questions = testData.questions.map(q => {
    if (q.type === 'expressionBuilder') {
      if (Array.isArray(q.placeholders)) {
        q.placeholders = q.placeholders.map((ph, i) => ({
          ...ph,
          id: pick(ph, ['id', 'name', 'key'], `p${i + 1}`),
          expectedType: pick(ph, ['expectedType', 'type', 'category'], ''),
          expected: pick(ph, ['expected', 'value', 'answer', 'correct'], ''),
        }));
      }
      if (Array.isArray(q.availableItems)) {
        q.availableItems = q.availableItems.map((it, i) => ({
          ...it,
          id: pick(it, ['id', 'uid', 'key'], `item_${i + 1}`),
          content: pick(it, ['content', 'text', 'value', 'label', 'title'], ''),
          category: pick(it, ['category', 'type', 'kind'], ''),
        }));
      }
      if (q.template != null) q.template = String(q.template);
    }
    if (q.type === 'single' || q.type === 'multiple') {
      if (Array.isArray(q.options)) q.options = q.options.map(o => String(o ?? ''));
      if (Array.isArray(q.correctAnswers)) q.correctAnswers = q.correctAnswers.map(c => String(c ?? ''));
    }
    if (q.questionText != null) q.questionText = String(q.questionText);
    return q;
  });
  return testData;
}

function normalizeCategories(testData, isMath) {
  if (!testData?.questions || !Array.isArray(testData.questions)) return testData;
  const canonical = isMath
    ? ['number', 'symbol', 'function', 'variable', 'operator']
    : ['keyword', 'identifier', 'operator', 'separator', 'builtin'];
  const synonyms = isMath
    ? { 'numbers':'number','integer':'number','int':'number','float':'number','digit':'number','coefficient':'number','vars':'variable','var':'variable','symbols':'symbol','functions':'function','operators':'operator','op':'operator' }
    : { 'function_name':'identifier','variable':'identifier','variables':'identifier','var':'identifier','string':'identifier','strings':'identifier','keywords':'keyword','operators':'operator','op':'operator','separators':'separator','punctuation':'separator','builtins':'builtin' };
  const normalize = (cat) => {
    const c = String(cat || '').toLowerCase().trim();
    if (canonical.includes(c)) return c;
    if (synonyms[c]) return synonyms[c];
    return canonical[0];
  };
  testData.questions = testData.questions.map(q => {
    if (q.type !== 'expressionBuilder') return q;
    if (Array.isArray(q.placeholders)) q.placeholders = q.placeholders.map(ph => ({ ...ph, expectedType: normalize(ph.expectedType) }));
    if (Array.isArray(q.availableItems)) q.availableItems = q.availableItems.map(it => ({ ...it, category: normalize(it.category) }));
    return q;
  });
  return testData;
}

function cleanupOptions(testData) {
  if (!testData?.questions || !Array.isArray(testData.questions)) return testData;
  testData.questions = testData.questions.map(q => {
    if (q.type !== 'single' && q.type !== 'multiple') return q;
    if (!Array.isArray(q.options)) return q;
    const questionText = String(q.questionText || '').trim();
    q.options = q.options.map(opt => {
      let s = String(opt || '');
      s = s.replace(/```[\s\S]*?```/g, '').trim();
      if (questionText && s.includes(questionText)) s = s.replace(questionText, '').trim();
      s = s.replace(/^[\s:.,;]+/, '').trim();
      if (!s) {
        const original = String(opt || '').replace(/```[\s\S]*?```/g, '').trim();
        const lines = original.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          s = lines[lines.length - 1];
          if (questionText && s.includes(questionText)) s = s.replace(questionText, '').trim();
        }
      }
      if (s.length > 120) {
        const lines = s.split('\n').map(l => l.trim()).filter(Boolean);
        s = lines[lines.length - 1] || s;
      }
      s = s.replace(/^[\s:.,;]+/, '').trim();
      if (!s) s = String(opt || '').trim().slice(0, 200);
      if (s.length > 200) s = s.slice(0, 200).trim() + '…';
      return s;
    });
    return q;
  });
  return testData;
}

const SUBSCRIPT_CHARS = 'ₐₑₒₓₔᵢᵤₕₖₗₘₙₚₛₜᵥ';
const SUPERSCRIPT_CHARS = 'ᵃᵇᵈᵉᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ';

function normalizeSubSup(text) {
  let s = String(text || '');
  for (const ch of SUBSCRIPT_CHARS) s = s.split(ch).join('_');
  for (const ch of SUPERSCRIPT_CHARS) s = s.split(ch).join('_');
  s = s.replace(/_([а-яёa-z])_/gi, '_');
  s = s.replace(/~([а-яёa-z])~/gi, '_');
  s = s.replace(/\^([а-яёa-z])\^/gi, '_');
  s = s.replace(/__+/g, '_');
  return s;
}

function normalizeStressFormat(testData) {
  if (!testData?.questions) return testData;
  testData.questions = testData.questions.map(q => {
    if (q.type !== 'single' && q.type !== 'multiple') return q;
    const qText = String(q.questionText || '').toLowerCase();
    const isStress = /ударени|орфоэпи/i.test(qText);
    if (!isStress) return q;

    const fixOpt = (opt) => {
      let s = String(opt || '').trim();
      s = s.replace(/\*\*([а-яёa-z])\*\*/gi, (_, letter) => letter.toUpperCase());
      s = s.replace(/\*([а-яёa-z])\*/gi, (_, letter) => letter.toUpperCase());
      s = s.replace(/__([а-яёa-z])__/gi, (_, letter) => letter.toUpperCase());
      s = s.replace(/_([а-яё])_/gi, (_, letter) => letter.toUpperCase());
      s = s.replace(/`([а-яёa-z])`/gi, (_, letter) => letter.toUpperCase());
      s = s.replace(/([а-яёa-z])\u0301/gi, (_, letter) => letter.toUpperCase());
      s = s.replace(/'([а-яёa-z])/gi, (_, letter) => letter.toUpperCase());
      s = s.replace(/\*+/g, '');
      s = s.replace(/_+/g, '');
      s = s.replace(/`/g, '');
      s = s.replace(/[()]/g, '').trim();
      return s;
    };

    q.options = (q.options || []).map(fixOpt);
    q.correctAnswers = (q.correctAnswers || []).map(fixOpt);
    return q;
  });
  return testData;
}

function normalizeOrthographyFormat(testData, isRussian) {
  if (!isRussian || !testData?.questions) return testData;
  testData.questions = testData.questions.map(q => {
    if (q.type !== 'single' && q.type !== 'multiple') return q;
    const qText = String(q.questionText || '').toLowerCase();
    const isOrthography = /пропуск|пишется|вставьте|вставь|букв[аеуыо]/i.test(qText)
      && !/ударени/i.test(qText);
    if (!isOrthography) return q;
    q.options = (q.options || []).map(o => normalizeSubSup(o));
    q.correctAnswers = (q.correctAnswers || []).map(o => normalizeSubSup(o));
    return q;
  });
  return testData;
}

function normalizeStringEscapes(v) {
  if (typeof v === 'string') {
    return v.replace(/\\([nt])([a-zA-Z]*)/g, (m, c, rest) => {
      if (rest && LATEX_WORDS.has(c + rest)) return m;
      return (c === 'n' ? '\n' : '\t') + rest;
    });
  }
  if (Array.isArray(v)) return v.map(normalizeStringEscapes);
  if (v && typeof v === 'object') {
    const r = {};
    for (const k in v) r[k] = normalizeStringEscapes(v[k]);
    return r;
  }
  return v;
}

function normalizeTestStrings(testData) {
  if (!testData.questions) return testData;
  testData.questions = testData.questions.map(q => normalizeStringEscapes(q));
  return testData;
}

function unifyPlaceholders(testData, isMath) {
  if (!testData.questions) return testData;
  testData.questions = testData.questions.map(q => {
    if (q.type !== 'expressionBuilder' || !q.template) return q;
    if (isMath) q.template = q.template.replace(/\{\{(\w+)\}\}/g, '@@$1@@');
    else q.template = q.template.replace(/@@(\w+)@@/g, '{{$1}}');
    return q;
  });
  return testData;
}

function normalizePlaceholderIds(testData) {
  if (!testData?.questions) return testData;
  testData.questions = testData.questions.map(q => {
    if (q.type !== 'expressionBuilder') return q;
    const phs = q.placeholders || [];
    const map = new Map();
    phs.forEach((ph, i) => {
      let newId = String(ph.id || '').trim();
      if (!newId || /^\d+$/.test(newId) || newId.toLowerCase() === 'id') {
        newId = `ans${phs.length > 1 ? i + 1 : ''}`;
      }
      newId = newId.replace(/[^a-zA-Z0-9_]/g, '') || `ans${i + 1}`;
      map.set(ph.id, newId);
      ph.id = newId;
    });
    if (q.template) {
      map.forEach((newId, oldId) => {
        const escaped = String(oldId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        q.template = q.template
          .replace(new RegExp(`@@${escaped}@@`, 'g'), `@@${newId}@@`)
          .replace(new RegExp(`\\{\\{${escaped}\\}\\}`, 'g'), `{{${newId}}}`);
      });
      if (phs.length > 0) {
        const firstId = phs[0].id;
        q.template = q.template.replace(/@@id@@/g, `@@${firstId}@@`).replace(/\{\{id\}\}/g, `{{${firstId}}}`);
      }
    }
    return q;
  });
  return testData;
}

function stripLatexFromPython(testData, isMath) {
  if (isMath || !testData.questions) return testData;
  testData.questions = testData.questions.map(q => {
    if (q.questionText && /\$|\\[a-zA-Z]/.test(q.questionText)) {
      q.questionText = q.questionText.replace(/\$([^$]+)\$/g, '$1').replace(/\\[a-zA-Z]+/g, '').replace(/\s+/g, ' ').trim();
    }
    return q;
  });
  return testData;
}

function hasLatexContent(text) {
  return /\\[a-zA-Z]+/.test(text)
      || /\b(sin|cos|tan|log|ln|sqrt|abs|lim)\s*\(/.test(text);
}

function autoWrapLatex(text) {
  if (!text) return text;
  let s = String(text);
  if (!hasLatexContent(s)) return s;

  s = s.replace(/@@(\w+)@@/g, (_, n) => '\u0001' + n + '\u0001');

  const segs = s.split(/(\$[^$]+\$)/g);

  const result = segs.map(seg => {
    if (seg.startsWith('$') && seg.endsWith('$') && seg.length > 2) return seg;
    if (!hasLatexContent(seg)) return seg;

    const parts = [];
    let lastIdx = 0;
    const cyrRegex = /[\u0400-\u04FF]+/g;
    let m;
    while ((m = cyrRegex.exec(seg)) !== null) {
      if (m.index > lastIdx) parts.push({ math: true, text: seg.slice(lastIdx, m.index) });
      parts.push({ math: false, text: m[0] });
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < seg.length) parts.push({ math: true, text: seg.slice(lastIdx) });

    return parts.map(p => {
      if (!p.math) return p.text;
      if (!hasLatexContent(p.text)) return p.text;
      const trimmed = p.text.trim();
      const lead = p.text.match(/^\s*/)[0];
      const trail = p.text.match(/\s*$/)[0];
      const inner = trimmed.replace(/\u0001(\w+)\u0001/g, '$1');
      return lead + '$' + inner + '$' + trail;
    }).join('');
  }).join('');

  s = result.replace(/\u0001(\w+)\u0001/g, (_, n) => '$' + n + '$');
  return s;
}

function wrapLatexInTestData(testData, isMath) {
  if (!isMath || !testData?.questions) return testData;
  testData.questions = testData.questions.map(q => {
    if (q.questionText) q.questionText = autoWrapLatex(q.questionText);
    if (Array.isArray(q.options)) q.options = q.options.map(o => autoWrapLatex(o));
    if (Array.isArray(q.correctAnswers)) q.correctAnswers = q.correctAnswers.map(c => autoWrapLatex(c));
    return q;
  });
  return testData;
}

// ============================================================
// ВАЛИДАЦИЯ
// ============================================================
const AMBIGUOUS_STRESS_WORDS = ['творог','щавель','звонит','каталог','договор','свёкла','красивее','торты','банты','шарфы'];

function validateTestData(testData, isMath, isRussian = false) {
  const critical = [];
  const cosmetic = [];

  if (!Array.isArray(testData.questions) || testData.questions.length === 0) {
    return { critical: ['Список questions пуст.'], cosmetic: [] };
  }

  testData.questions.forEach((q, idx) => {
    if (q.type === 'single' || q.type === 'multiple') {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        critical.push(`Q${idx + 1}: меньше 2 вариантов ответа.`);
      }
      if (!q.correctAnswers || q.correctAnswers.length === 0) {
        critical.push(`Q${idx + 1}: не указан правильный ответ.`);
      }

      if (isRussian && q.questionText) {
        const qText = String(q.questionText);
        const qLower = qText.toLowerCase();

        if (/выделенн\w+ слов|подчёркнут\w+ слов|подчеркнут\w+ слов|слово,?\s+выделенн|слово в скобках|слово,?\s+заключённ/i.test(qText)) {
          critical.push(`Q${idx + 1}: ссылка на визуальное выделение — в UI его нет.`);
        }

        if (/ударени[ея]\s+на\s+(перв|втор|трет|четв|пят|шест|седьм|восьм|девят|десят|последн)/i.test(qLower)) {
          critical.push(`Q${idx + 1}: формулировка "ударение на N-й слог" ненадёжна — используйте "В каком слове верно выделена буква, обозначающая ударный гласный звук?".`);
        }

        const isOrthography = /пропуск|букв[аеуыо]|пишется|вставьте|вставь/i.test(qLower)
          && !/ударени/i.test(qLower);
        if (isOrthography) {
          const opts = q.options || [];
          const blankCount = opts.filter(o => String(o || '').includes('_') || String(o || '').includes('…')).length;
          if (blankCount === 0) {
            critical.push(`Q${idx + 1}: орфография без пропуска "_" в вариантах.`);
          }
        }

        const isStress = /ударени|орфоэпи/i.test(qLower);
        if (isStress) {
          const allText = qText + ' ' + (q.options || []).join(' ');
          const hasAmbiguous = AMBIGUOUS_STRESS_WORDS.some(w =>
            new RegExp(`(^|[^а-яё])${w}([^а-яё]|$)`, 'i').test(allText)
          );
          if (hasAmbiguous) {
            critical.push(`Q${idx + 1}: задание на ударение содержит спорное слово.`);
          }

          const opts = q.options || [];
          const badFormat = opts.some(o => {
            const s = String(o || '');
            if (/\*|_|`/.test(s)) return true;
            const upperCount = (s.match(/[А-ЯЁ]/g) || []).length;
            return upperCount !== 1;
          });
          if (badFormat) {
            critical.push(`Q${idx + 1}: в каждом варианте должна быть РОВНО ОДНА заглавная буква, без звёздочек/подчёркиваний.`);
          }
        }

        const isParonym = /пароним/i.test(qLower);
        if (isParonym) {
          const opts = q.options || [];
          const hasContext = opts.every(o => String(o || '').split(/\s+/).length >= 3);
          if (!hasContext) {
            critical.push(`Q${idx + 1}: паронимы без контекста.`);
          }
        }
      }

      if (isRussian && q.type === 'single') {
        if (q.correctAnswers && q.correctAnswers.length !== 1) {
          critical.push(`Q${idx + 1}: single — РОВНО 1 правильный ответ.`);
        }
      }

      if (isRussian && q.type === 'multiple') {
        if (q.correctAnswers && (q.correctAnswers.length < 2 || q.correctAnswers.length > 4)) {
          critical.push(`Q${idx + 1}: multiple — от 2 до 4 правильных ответов.`);
        }
      }

      const qText = String(q.questionText || '').trim();
      if (qText && (q.options || []).some(o => String(o || '').includes(qText))) {
        cosmetic.push(`Q${idx + 1}: вопрос дублируется в options.`);
      }
    }

    if (q.type !== 'expressionBuilder') return;
    const phs = q.placeholders || [];
    const items = q.availableItems || [];

    if (phs.length === 0) {
      critical.push(`Q${idx + 1}: нет плейсхолдеров (placeholders пустой).`);
    }

    phs.forEach((ph, pi) => {
      if (!ph.id || String(ph.id).trim() === '') {
        critical.push(`Q${idx + 1}: у плейсхолдера #${pi + 1} нет id.`);
      }
      if (!ph.expected || String(ph.expected).trim() === '') {
        critical.push(`Q${idx + 1}: у плейсхолдера "${ph.id || pi + 1}" не указан expected.`);
      }
    });

    phs.forEach(ph => {
      if (ph.expected && !items.some(it => it.content === ph.expected)) {
        critical.push(`Q${idx + 1}: нет элемента "${ph.expected}" в корзине.`);
      }
    });

    if (phs.length > 0 && items.length === 0) {
      critical.push(`Q${idx + 1}: пустая корзина (availableItems).`);
    }

    const emptyItems = items.filter(it => !it.content || String(it.content).trim() === '');
    if (emptyItems.length > 0) {
      critical.push(`Q${idx + 1}: ${emptyItems.length} элемент(ов) в корзине без content.`);
    }

    if (!q.template || !String(q.template).trim()) {
      critical.push(`Q${idx + 1}: пустой шаблон.`);
    }

    if (q.template && phs.length > 0) {
      const missing = phs.filter(ph =>
        !q.template.includes(`@@${ph.id}@@`) && !q.template.includes(`{{${ph.id}}}`)
      );
      if (missing.length > 0) {
        critical.push(`Q${idx + 1}: в шаблоне нет: ${missing.map(p => p.id).join(', ')}.`);
      }
    }

    if (q.template && !/@@\w+@@/.test(q.template) && !/\{\{\w+\}\}/.test(q.template)) {
      critical.push(`Q${idx + 1}: в шаблоне нет ни одного @@плейсхолдера@@ — уже подставлены значения.`);
    }

    if (isMath && q.questionText) {
      const qText = String(q.questionText);
      const hasDigitsInQuestion = /\d/.test(qText);
      const numericExpected = phs
        .map(p => String(p.expected).trim())
        .filter(v => /^\d+(\.\d+)?$/.test(v));
      if (!hasDigitsInQuestion && numericExpected.length > 0) {
        critical.push(`Q${idx + 1}: в тексте задачи нет числовых данных (a, b, c не заданы) — задача нерешаема.`);
      }
    }

    if (isMath && phs.length > 0) {
      const qText = String(q.questionText || '');
      const allVarsAsExpected = phs.every(ph => {
        const exp = String(ph.expected || '').trim();
        return /^[a-zA-Z]$/.test(exp) && qText.includes(exp);
      });
      const hasDigitsInAvailable = items.some(it => /^\d/.test(String(it.content || '')));
      if (allVarsAsExpected && !hasDigitsInAvailable) {
        critical.push(`Q${idx + 1}: в плейсхолдеры подставлены буквенные переменные вместо числовых значений.`);
      }
    }

    // 🆕 Если ВСЕ expected уже присутствуют в тексте задачи как отдельные числа —
    //    ученик просто копирует, а не решает.
    if (isMath && phs.length > 0 && q.questionText) {
      const qText = String(q.questionText);
      const allValuesInText = phs.every(ph => {
        const exp = String(ph.expected || '').trim();
        if (!exp) return false;
        const escaped = exp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^0-9a-zA-Z.])${escaped}([^0-9a-zA-Z.]|$)`).test(qText);
      });
      if (allValuesInText) {
        critical.push(`Q${idx + 1}: все значения для плейсхолдеров уже есть в тексте задачи — ученик просто копирует, а не решает.`);
      }
    }

    // 🆕 Если плейсхолдер один и его expected встречается в тексте — точно копирование
    if (isMath && phs.length === 1 && q.questionText) {
      const exp = String(phs[0].expected || '').trim();
      if (exp) {
        const escaped = exp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(^|[^0-9a-zA-Z.])${escaped}([^0-9a-zA-Z.]|$)`);
        if (re.test(String(q.questionText))) {
          critical.push(`Q${idx + 1}: единственный плейсхолдер уже заполнен значением из текста — задача бессмысленна.`);
        }
      }
    }

    if (isMath && q.template && q.questionText) {
      const expectedValues = phs.map(p => String(p.expected).trim()).filter(v => v.length > 0 && v.length < 10);
      if (expectedValues.length >= 2) {
        const qText = String(q.questionText);
        const leakedValues = expectedValues.filter(v => {
          const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`(^|[^0-9a-zA-Z.])${escaped}([^0-9a-zA-Z.]|$)`).test(qText);
        });
        if (leakedValues.length === expectedValues.length) {
          critical.push(`Q${idx + 1}: все значения уже в тексте вопроса.`);
        }
      }
    }

    const minItems = phs.length <= 1 ? 3 : Math.max(phs.length * 2, phs.length + 3);
    if (phs.length > 0 && items.length < minItems) {
      cosmetic.push(`Q${idx + 1}: элементов ${items.length}, желательно ≥${minItems}.`);
    }
  });

  return { critical, cosmetic };
}

// ============================================================
// TOP-UP: добираем недостающие вопросы после дедупликации
// ============================================================
async function topUpToCount({
  testData, requestedCount, systemMessage, userPrompt,
  API_KEY, FOLDER_ID, processResponse, totalUsage, maxAttempts = 3,
}) {
  let attempt = 0;
  while (testData.questions.length < requestedCount && attempt < maxAttempts) {
    const missing = requestedCount - testData.questions.length;
    const existingTexts = testData.questions
      .map(q => String(q.questionText || '').trim().slice(0, 140))
      .filter(Boolean);

    const topUpPrompt = `${userPrompt}

⚠️ У ТЕБЯ УЖЕ ЕСТЬ ${existingTexts.length} ВОПРОСОВ:
${existingTexts.map(t => '— ' + t).join('\n')}

🔴 Сгенерируй РОВНО ${missing} НОВЫХ вопросов, КОТОРЫХ НЕТ в списке выше.
   - Другие темы, другие формулировки, другие числа.
   - НЕ повторяй ни одну строку из списка выше.
   - В массиве "questions" верни РОВНО ${missing} элементов.
   - Формат — тот же.`;

    try {
      const r = await callGPT(
        [{ role: 'system', text: systemMessage }, { role: 'user', text: topUpPrompt }],
        API_KEY, FOLDER_ID, 6000, 0.8
      );
      totalUsage.inputTokens += r.usage.inputTokens;
      totalUsage.completionTokens += r.usage.completionTokens;
      totalUsage.totalTokens += r.usage.totalTokens;

      console.log(`--- Top-up #${attempt + 1} (нужно ${missing}, есть ${testData.questions.length}) ---`);
      console.log(r.text);

      const extra = processResponse(r.text);
      const before = testData.questions.length;
      testData.questions = [...testData.questions, ...(extra.questions || [])];
      testData = deduplicateQuestions(testData);

      if (testData.questions.length === before) {
        console.warn('⚠️  Top-up не добавил новых вопросов — прерываю');
        break;
      }
      console.log(`✅ Top-up: ${before} → ${testData.questions.length} (цель ${requestedCount})`);
    } catch (e) {
      console.warn('Top-up error:', e.message);
      break;
    }
    attempt++;
  }
  return testData;
}

// ============================================================
// ВЫЗОВ YANDEXGPT
// ============================================================
async function callGPT(messages, API_KEY, FOLDER_ID, maxTokens = 6000, temperature = 0.8, model = 'yandexgpt/latest') {
  const response = await axios.post(
    'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
    {
      modelUri: `gpt://${FOLDER_ID}/${model}`,
      completionOptions: { stream: false, temperature, maxTokens },
      messages,
    },
    { headers: { Authorization: `Api-Key ${API_KEY}`, 'Content-Type': 'application/json' } }
  );
  const d = response.data;
  return {
    text: d.result.alternatives[0].message.text,
    usage: {
      inputTokens: Number(d.result.usage?.inputTextTokens) || 0,
      completionTokens: Number(d.result.usage?.completionTokens) || 0,
      totalTokens: Number(d.result.usage?.totalTokens) || 0,
    },
  };
}

function isComplexMath(text) {
  return /\\(log|ln|int|iint|sin|cos|tan|lim|frac\{\\sqrt)/i.test(text)
      || /параметр|производн|интеграл|логарифм|тригонометр/i.test(text);
}

// ============================================================
// ВЕРИФИКАЦИЯ
// ============================================================
async function verifyGroup(questions, API_KEY, FOLDER_ID, isMath, isRussian = false) {
  if (!isMath && !isRussian) return { invalidIndices: [], tokens: 0, skipped: true };

  const toVerify = questions
    .map((q, i) => ({ idx: i, q }))
    .filter(({ q }) => q.type === 'single' || q.type === 'multiple');

  if (toVerify.length === 0) return { invalidIndices: [], tokens: 0 };

  if (isRussian) return await verifyRussian(toVerify, questions, API_KEY, FOLDER_ID);

  const hasComplex = toVerify.some(({ q }) => isComplexMath(q.questionText || ''));
  const model = hasComplex ? 'yandexgpt/latest' : 'yandexgpt-lite/latest';

  const lines = toVerify.map(({ idx, q }) => {
    const opts = (q.options || []).map((o, i) => `${i + 1}) ${o}`).join(' ');
    const kind = q.type === 'single' ? 'один' : 'все верные';
    return `[${idx + 1}] ${q.questionText}\n${opts}\n→ ${kind}`;
  }).join('\n\n');

  const prompt = `Реши КАЖДОЕ задание САМ, шаг за шагом. Не доверяй вариантам.

🔴 ВАЖНО для выбора ответов:
1. Проверь ВСЕ варианты по очереди, а не только первый подходящий.
2. Если для single-вопроса ПРАВИЛЬНЫХ несколько (например, x²−9=0 имеет корни 3 И −3) — верни ВСЕ правильные номера.
3. Если указан тип "single", но правильных ответов 2+, значит составитель ошибся — верни все правильные.
4. Пустой массив [] = ни один вариант не подходит.

Верни JSON: [{"n":1,"answers":[номер1, номер2, ...]}, ...]

${lines}`;

  try {
    const { text, usage } = await callGPT(
      [{ role: 'system', text: 'Отвечай ТОЛЬКО JSON-массивом.' }, { role: 'user', text: prompt }],
      API_KEY, FOLDER_ID, 600, 0.0, model
    );

    const cleaned = text.replace(/```json|```/g, '').trim();
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!arrMatch) return { invalidIndices: [], tokens: usage.totalTokens };

    const parsed = JSON.parse(arrMatch[0]);
    const invalidIndices = [];

    parsed.forEach(({ n, answers }) => {
      const q = questions[n - 1];
      if (!q || !Array.isArray(answers)) return;
      if (answers.length === 0) { invalidIndices.push(n - 1); console.warn(`⚠️ Q${n}: нет ответа`); return; }
      const aiOpts = answers.map(i => (q.options || [])[i - 1]).filter(Boolean);
      const declared = q.correctAnswers || [];
      const aSet = new Set(aiOpts), dSet = new Set(declared);
      if (!(aSet.size === dSet.size && [...aSet].every(v => dSet.has(v)))) {
        invalidIndices.push(n - 1);
        console.warn(`⚠️ Q${n}: AI [${aiOpts.join(', ')}], указано [${declared.join(', ')}]`);
      }
    });

    return { invalidIndices, tokens: usage.totalTokens };
  } catch (e) {
    console.warn('Verify error:', e.message);
    return { invalidIndices: [], tokens: 0 };
  }
}

async function verifyRussian(toVerify, questions, API_KEY, FOLDER_ID) {
  const qTexts = toVerify.map(({ q }) => q.questionText || '').join(' ');
  const russianType = detectRussianType(qTexts);
  const simpleTypes = ['stress', 'orthography'];
  const model = simpleTypes.includes(russianType) ? 'yandexgpt-lite/latest' : 'yandexgpt/latest';

  const blindLines = toVerify.map(({ idx, q }) => {
    const opts = (q.options || []).map((o, i) => `  ${i + 1}) ${o}`).join('\n');
    return `### Q${idx + 1} (${q.type})
Вопрос: ${q.questionText}
Варианты:
${opts}`;
  }).join('\n\n');

  const blindPrompt = `Ты — эксперт ЕГЭ по русскому языку. Реши каждое задание САМ.

ПРАВИЛА:
- single → РОВНО один правильный вариант.
- multiple → 2–4 правильных.
- Если задание некорректное — верни [] для этого номера.

Верни JSON: [{"n": 1, "answers": [номер]}]

ЗАДАНИЯ:

${blindLines}`;

  let blindAnswers = [];
  let totalTokens = 0;

  try {
    const { text, usage } = await callGPT(
      [
        { role: 'system', text: 'Ты эксперт по русскому. Отвечай ТОЛЬКО JSON.' },
        { role: 'user', text: blindPrompt },
      ],
      API_KEY, FOLDER_ID, 1200, 0.0, model
    );
    totalTokens += usage.totalTokens;
    const cleaned = text.replace(/```json|```/g, '').trim();
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) blindAnswers = JSON.parse(arrMatch[0]);
  } catch (e) {
    console.warn('Blind verify error:', e.message);
    return { invalidIndices: [], tokens: totalTokens };
  }

  const invalidIndices = [];

  blindAnswers.forEach(({ n, answers }) => {
    const q = questions[n - 1];
    if (!q || !Array.isArray(answers)) return;

    if (answers.length === 0) {
      invalidIndices.push(n - 1);
      console.warn(`⚠️ Q${n} (русский): задание некорректно`);
      return;
    }

    const aiOpts = answers.map(i => (q.options || [])[i - 1]).filter(Boolean);
    const declared = q.correctAnswers || [];
    const aSet = new Set(aiOpts), dSet = new Set(declared);

    if (!(aSet.size === dSet.size && [...aSet].every(v => dSet.has(v)))) {
      invalidIndices.push(n - 1);
      console.warn(`⚠️ Q${n} (русский): AI [${aiOpts.join(', ')}], указано [${declared.join(', ')}]`);
    }
  });

  return { invalidIndices, tokens: totalTokens };
}

// ============================================================
// SYSTEM MESSAGE ДЛЯ РУССКОГО
// ============================================================
function buildRussianSystemMessage() {
  return `Ты — методист ЕГЭ/ОГЭ по русскому языку. Составляешь тесты по реальным КИМ.

🔴🔴🔴 ГЛАВНОЕ ПРАВИЛО ДЛЯ ЗАДАНИЙ НА УДАРЕНИЕ 🔴🔴🔴

Формулировка ВСЕГДА одна и та же:
  "В каком слове верно выделена буква, обозначающая ударный гласный звук?"

🚫 КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ формулировки:
  - "Укажите слово с ударением на первый слог"
  - "Укажите слово с ударением на второй слог"
  - "Укажите слово, в котором ударение падает на..."
  - любые формулировки с указанием НОМЕРА слога

✅ Разрешена ТОЛЬКО формулировка:
  "В каком слове верно выделена буква, обозначающая ударный гласный звук?"

ФОРМАТ вариантов:
  - РОВНО ОДНА заглавная буква в слове (та, на которую падает ударение).
  - БЕЗ звёздочек (**), БЕЗ подчёркиваний (_), БЕЗ кавычек и бэктиков.
  - 3 варианта с НЕПРАВИЛЬНЫМ ударением + 1 вариант с ПРАВИЛЬНЫМ.

✅ ПРАВИЛЬНО:
  "options": ["алфАвит", "алфавИт", "Алфавит", "алфавитА"]
  "correctAnswers": ["алфавИт"]

❌ НЕПРАВИЛЬНО:
  "options": ["звон**И**т", "газопров**О**д", "обл**Е**гчить", "догов**О**р"]

🔴 СПИСОК слов для ударений (только эти, в них ударение однозначно):
алфавИт, дефИс, квартАл, цемЕнт, ходАтайство, избалОванный, дОсуг,
каталОг, нАчал, партЕр, портфЕль, свЁкла, срЕдства, тОрты, цепОчка,
шофЁр, щавЕль, экспЕрт, звонИт, облегчИть, договОр, красИвее, позвонИшь

🚫 ЗАПРЕЩЕНЫ (спорные): творог, щавель, звонит, каталог (устар.), свёкла, красивее.

🔴 ОБЩИЕ ЗАПРЕТЫ (нарушение = перегенерация):
1. 🚫 НЕ ссылайся на визуальное выделение: "выделенное слово", "подчёркнутое".
2. 🚫 НЕ используй спорные слова.
3. 🚫 НЕ выдумывай несуществующие слова.
4. Для single — РОВНО ОДИН правильный ответ.
5. Для multiple — 2–4 правильных ответа.
6. 🚫 ВСЕ вопросы должны быть РАЗНЫМИ по формулировке и содержанию. НЕ повторяй одну и ту же формулировку с разными словами!

🔴 ФОРМАТ ОТВЕТОВ:
- УДАРЕНИЕ: слово с ОДНОЙ заглавной буквой (алфавИт), БЕЗ подчёркиваний и звёздочек!
- ОРФОГРАФИЯ: слово с "_" на месте пропуска (пр_шить).
- ПАРОНИМЫ: предложение или словосочетание.
- ПУНКТУАЦИЯ: полное предложение.

Тип вопроса: ТОЛЬКО single и multiple.`;
}

function buildRussianUserPrompt({ topic, finalCount, examBlock, seed, recentList, russianType }) {
  const commonHeader = `${seed ? `SEED: ${seed}.\n` : ''}Запрос: "${topic}"

${recentList ? `НЕ повторяй: ${recentList}\n` : ''}${examBlock}

Сгенерируй РОВНО ${finalCount} вопросов по русскому.
Типы: ТОЛЬКО single и multiple.

🔴 КАЖДЫЙ ВОПРОС ДОЛЖЕН БЫТЬ УНИКАЛЬНЫМ:
- Разные формулировки вопроса.
- Разные слова / предложения / контексты.
- НЕ повторяй один и тот же шаблон с разными данными.

ОБЩИЕ ПРАВИЛА:
- НЕ ссылайся на "выделенное слово".
- Для single — РОВНО 1 правильный.
- Для multiple — 2–4 правильных.
- Все options/correctAnswers — СТРОКИ.
`;

  const formats = {
    stress: `ТИП ЗАДАНИЯ: УДАРЕНИЕ (орфоэпия)

🔴 ФОРМУЛИРОВКА ВОПРОСА — ТОЛЬКО ТАКАЯ:
  "В каком слове верно выделена буква, обозначающая ударный гласный звук?"

🔴 ФОРМАТ ОТВЕТОВ:
- Слово с ОДНОЙ заглавной буквой.
- БЕЗ звёздочек (**), БЕЗ подчёркиваний (_), БЕЗ кавычек.
- 3 варианта с НЕПРАВИЛЬНЫМ ударением + 1 с ПРАВИЛЬНЫМ.

🔴 Используй РАЗНЫЕ слова в каждом вопросе. Не повторяй одно слово дважды.
🔴 ДОСТУПНЫЕ СЛОВА (используй ТОЛЬКО их):
алфавИт, дефИс, квартАл, цемЕнт, ходАтайство, избалОванный, дОсуг,
каталОг, нАчал, партЕр, портфЕль, свЁкла, срЕдства, тОрты, цепОчка,
шофЁр, щавЕль, экспЕрт, звонИт, облегчИть, договОр, красИвее, позвонИшь

ПРИМЕР:
"questionText": "В каком слове верно выделена буква, обозначающая ударный гласный звук?",
"options": ["звОнит", "звонИт", "звонит", "звонИть"],
"correctAnswers": ["звонИт"]`,

    orthography: `ТИП ЗАДАНИЯ: ОРФОГРАФИЯ

Формулировка ОБЯЗАТЕЛЬНО с "пропуск":
"Укажите слова, в которых на месте пропуска пишется буква И"

🔴 ФОРМАТ: В КАЖДОМ варианте "_" на месте пропуска. ТОЛЬКО обычное подчёркивание, БЕЗ Unicode-символов!

✅ "пр_мер", "пр_шить", "пр_бежать", "пр_школьный"
❌ "пример", "пр_мер_", "прₑмер"

ПРИМЕР:
"questionText": "Укажите слова, в которых на месте пропуска пишется буква И",
"options": ["пр_мер", "пр_шить", "пр_бежать", "пр_школьный"],
"correctAnswers": ["пр_шить"]`,

    punctuation: `ТИП ЗАДАНИЯ: ПУНКТУАЦИЯ

Формулировка: "Укажите предложение, в котором нужно поставить ДВЕ запятые"

Все варианты — ПОЛНЫЕ предложения.

ПРИМЕР:
"questionText": "Укажите предложение, в котором перед союзом И ставится запятая",
"options": [
  "Он пришёл, и мы начали работать.",
  "Он пришёл и сразу сел за стол.",
  "Пришёл он и сел за стол.",
  "И он, и она пришли."
],
"correctAnswers": ["Он пришёл, и мы начали работать."]`,

    paronym: `ТИП ЗАДАНИЯ: ПАРОНИМЫ

Формулировка С КОНТЕКСТОМ: "В каком предложении вместо X нужно Y?"

Каждый вариант — предложение (минимум 3 слова).

ПРИМЕР:
"questionText": "В каком предложении вместо 'надеть' нужно употребить 'одеть'?",
"options": [
  "Он надел пальто и вышел.",
  "Мама одела ребёнка в тёплую куртку.",
  "Надень шапку — холодно.",
  "Я надел очки, чтобы лучше видеть."
],
"correctAnswers": ["Мама одела ребёнка в тёплую куртку."]`,

    morphology: `ТИП ЗАДАНИЯ: МОРФОЛОГИЯ

ПРИМЕР:
"questionText": "Укажите примеры, в которых слово является прилагательным",
"options": ["весенний день", "зимнее утро", "красивый дом", "быстро бежит"],
"correctAnswers": ["весенний день", "зимнее утро", "красивый дом"]`,

    syntax: `ТИП ЗАДАНИЯ: СИНТАКСИС

Формулировка: "Укажите предложение с грамматической ошибкой"

ПРИМЕР:
"questionText": "Укажите предложение с грамматической ошибкой",
"options": [
  "Согласно расписанию мы отправились в путь.",
  "Благодаря поддержке друзей я справился.",
  "По приезду в город мы отдохнули.",
  "Вопреки прогнозу погода была хорошей."
],
"correctAnswers": ["По приезду в город мы отдохнули."]`,

    lexis: `ТИП ЗАДАНИЯ: ЛЕКСИКА

Формулировка: "Укажите предложение, в котором слово употреблено в значении '...'"

ПРИМЕР:
"questionText": "Укажите предложение, в котором слово 'свежий' употреблено в значении 'прохладный'",
"options": [
  "Свежий ветер дул с моря.",
  "Свежий хлеб пахнет вкусно.",
  "Свежий номер газеты вышел утром.",
  "Это свежий взгляд на проблему."
],
"correctAnswers": ["Свежий ветер дул с моря."]`,

    expressiveness: `ТИП ЗАДАНИЯ: ВЫРАЗИТЕЛЬНОСТЬ

Формулировка: "Укажите предложение, в котором использовано олицетворение"

ПРИМЕР:
"questionText": "Укажите предложение, в котором использовано олицетворение",
"options": [
  "Ветер воет за окном.",
  "Он бежал как молния.",
  "Золотая осень пришла.",
  "Синее небо над нами."
],
"correctAnswers": ["Ветер воет за окном."]`,

    generic: `ТИП ЗАДАНИЯ: ОБЩИЙ

Составь задания по теме, используя ТОЛЬКО single и multiple.
Формулировки точные. Все варианты правдоподобные.
Каждый вопрос — на свою подтему.`,
  };

  return `${commonHeader}

${formats[russianType] || formats.generic}

ФОРМАТ ОТВЕТА (JSON):

{
  "title": "...",
  "description": "...",
  "subject": "russian",
  "timeLimit": 15,
  "questions": [
    { "type": "single", "questionText": "...", "options": ["...", "...", "...", "..."], "correctAnswers": ["..."] },
    { "type": "multiple", "questionText": "...", "options": ["...", "...", "...", "..."], "correctAnswers": ["...", "..."] }
  ]
}`;
}

// ============================================================
// SYSTEM MESSAGE ДЛЯ МАТЕМАТИКИ И PYTHON
// ============================================================
function buildSystemMessage(isMath) {
  if (!isMath) {
    return `Ты — методист ЕГЭ/ОГЭ по Python. Отвечай ТОЛЬКО JSON.

PYTHON:
- expectedType/category: keyword, identifier, operator, separator, builtin.
- Плейсхолдеры: {{id}}.
- В questionText — БЕЗ $ и LaTeX, переносы через \\n.
- Код оборачивай в \`\`\`python\\n...\\n\`\`\`.

🚨 КРИТИЧНО ДЛЯ expressionBuilder:
1. В template ОБЯЗАТЕЛЬНО должны быть маркеры {{<id>}} для КАЖДОГО плейсхолдера.
2. В каждом placeholder поле "expected" ОБЯЗАТЕЛЬНО.
3. В КАЖДОМ availableItem поле "content" ОБЯЗАТЕЛЬНО — без пустых.
4. 🚫 ВСЕ вопросы должны быть РАЗНЫМИ. Не повторяй одну и ту же формулировку.

options — короткие. Все expected/options/content — СТРОКИ.`;
  }

  return `Ты — методист ЕГЭ/ОГЭ по математике. Отвечай ТОЛЬКО JSON.

🔴🔴🔴 ГЛАВНОЕ ПРАВИЛО expressionBuilder 🔴🔴🔴

Это задание типа "СОБЕРИ ФОРМУЛУ" — ученик перетаскивает элементы из корзины в плейсхолдеры.
Ученик НЕ решает задачу с нуля, он СОБИРАЕТ ОТВЕТ.

Поэтому:
1. В questionText — ТОЛЬКО задача с ЧИСЛОВЫМИ данными. БЕЗ формулы-ответа!
2. В template — ТОЛЬКО формула-ответ с @@плейсхолдерами@@ вместо значений.
3. В placeholders[].expected — ЧИСЛО, которое должно стоять на месте этого плейсхолдера.
4. В availableItems[].content — элементы для перетаскивания: ПРАВИЛЬНЫЕ + НЕВЕРНЫЕ (дистракторы).

📛 СТРОГО ЗАПРЕЩЕНО:
- Писать саму формулу-ответ в questionText.
- Класть в availableItems[].content буквенные переменные (a, b, c, x) — только числа и операторы.
- Класть в expected те же буквы, что уже есть в questionText.
- Оставлять пустые availableItems.
- Подставлять значения в template вместо @@плейсхолдеров@@.

✅ ПРАВИЛЬНАЯ структура (пример):

"questionText": "Найдите площадь треугольника со сторонами 3, 4 и 5 по формуле Герона. Ответ округлите до целого.",
"template": "$S = \\sqrt{@@p@@(@@p@@ - @@a@@)(@@p@@ - @@b@@)(@@p@@ - @@c@@)}$",
"placeholders": [
  { "id": "a", "expectedType": "number", "expected": "3" },
  { "id": "b", "expectedType": "number", "expected": "4" },
  { "id": "c", "expectedType": "number", "expected": "5" },
  { "id": "p", "expectedType": "number", "expected": "6" }
],
"availableItems": [
  { "id": "i1", "content": "3", "category": "number" },
  { "id": "i2", "content": "4", "category": "number" },
  { "id": "i3", "content": "5", "category": "number" },
  { "id": "i4", "content": "6", "category": "number" },
  { "id": "i5", "content": "7", "category": "number" },
  { "id": "i6", "content": "12", "category": "number" }
]

🔴 ДРУГИЕ ПРАВИЛА:
- expectedType/category: number, symbol, function, variable, operator.
- id: буквенные (a, b, ans, x1). НЕ "1", НЕ "id".
- КАЖДУЮ формулу оборачивай в ОДИНАРНЫЕ $...$ (НЕ $$...$$).
- Слэши удваивай.
- 🚫 ВСЕ вопросы ДОЛЖНЫ БЫТЬ РАЗНЫМИ. Не повторяй одну и ту же формулировку с разными числами.
- correctAnswers пересчитай дважды.
- 🆕 Для вопроса-уравнения с несколькими корнями (x²−9=0, x²=x, |x|=2 и т.п.)
  используй тип "multiple", а НЕ "single".
- 🆕 Для single-вопросов сформулируй так, чтобы правильный ответ был РОВНО ОДИН.
  Если у задачи может быть >1 правильного ответа — переходи на "multiple".
- 🆕 Для expressionBuilder: в тексте задачи должны быть ЧИСЛА, а в плейсхолдерах —
  ЗНАЧЕНИЯ, требующие ВЫЧИСЛЕНИЯ (промежуточные результаты), а не копирования.
  ❌ Плохо: "Найдите объём куба с ребром 4" → template="V = @@a@@^3", expected="4" — 4 уже есть в тексте.
  ✅ Хорошо: "Найдите объём куба с ребром 4" → template="V = @@V@@", expected="64" — 64 надо вычислить.

ФОРМАТ:

{
  "title": "...", "description": "...", "subject": "math", "timeLimit": 15,
  "questions": [
    { "type": "expressionBuilder", "questionText": "задача с числами", "template": "$...@@id@@...$", "placeholders": [...], "availableItems": [...] },
    { "type": "single", "questionText": "...", "options": [...], "correctAnswers": ["..."] },
    { "type": "multiple", "questionText": "...", "options": [...], "correctAnswers": ["...", "..."] }
  ]
}

options — короткие. Все expected/options/content — СТРОКИ.`;
}

function buildUserPrompt({ topic, subjectField, subjectName, isMath, finalCount, examBlock, seed, recentList }) {
  const mathTemplate = 'формула-ответ с @@<id>@@';
  const pyTemplate = 'шаблон с {{<id>}}';
  return `${seed ? `SEED: ${seed}.\n` : ''}Запрос: "${topic}"

${recentList ? `НЕ повторяй: ${recentList}\n` : ''}${examBlock}

Сгенерируй РОВНО ${finalCount} вопросов по ${subjectName}.
Типы: expressionBuilder ≥1, single ≥1, multiple ≥1.

🔴 КАЖДЫЙ ВОПРОС ДОЛЖЕН БЫТЬ УНИКАЛЬНЫМ.
- Разные формулировки, разные числа, разные подтемы.
- НЕ повторяй один и тот же шаблон с разными числами.

${isMath ? `
🔴 КРИТИЧНО ДЛЯ expressionBuilder:
- questionText: ТОЛЬКО задача с конкретными ЧИСЛАМИ (3, 4, 5). НЕ пиши формулу-ответ в тексте!
- template: формула-ОТВЕТ с @@плейсхолдерами@@ вместо значений.
- placeholders[].expected: значения, требующие ВЫЧИСЛЕНИЯ, а не копирования из текста!

❌ Плохо: "Найдите объём куба с ребром 4" → template="V = @@a@@^3", expected="4"
✅ Хорошо: "Найдите объём куба с ребром 4" → template="V = @@V@@", expected="64"

- availableItems[].content: числа и операторы (правильные + дистракторы).

Если expected содержит буквы a, b, c, x — это ОШИБКА. Заменяй на числа.

Элементов: 3 плейсхолдера → 6+, 4 → 8+.
Категории: number, symbol, function, variable, operator.

Пример правильного:
questionText: "Найдите площадь треугольника со сторонами 3, 4 и 5 по формуле Герона."
template: "$S = \\sqrt{@@p@@(@@p@@ - @@a@@)(@@p@@ - @@b@@)(@@p@@ - @@c@@)}$"
placeholders: [{"id":"a","expected":"3"}, {"id":"b","expected":"4"}, {"id":"c","expected":"5"}, {"id":"p","expected":"6"}]
availableItems: [{"content":"3"},{"content":"4"},{"content":"5"},{"content":"6"},{"content":"7"},{"content":"8"},{"content":"10"},{"content":"12"}]
` : `
Плейсхолдеры: {{id}}.
Обязательно: у каждого плейсхолдера есть "expected".
Обязательно: у каждого availableItem есть "content".
Элементов: 1 → 3+, 2 → 4+, 3 → 6+, 4 → 8+.
Категории: keyword, identifier, operator, separator, builtin.
`}

ФОРМАТ:

{
  "title": "...", "description": "...", "subject": "${subjectField}", "timeLimit": 15,
  "questions": [
    { "type": "expressionBuilder", "questionText": "...", "template": "${isMath ? mathTemplate : pyTemplate}", "placeholders": [...], "availableItems": [...] },
    { "type": "single", "questionText": "...", "options": [...], "correctAnswers": ["..."] },
    { "type": "multiple", "questionText": "...", "options": [...], "correctAnswers": ["...", "..."] }
  ]
}`;
}

// ============================================================
// HUMANIZE ERROR
// ============================================================
function humanizeError(err) {
  const raw = err.response?.data?.error?.message || err.message || 'Неизвестная ошибка';
  const l = raw.toLowerCase();
  if (l.includes('token') && (l.includes('exceed') || l.includes('limit'))) return 'AI вернул слишком длинный ответ. Уменьшите количество вопросов.';
  if (l.includes('timeout') || l.includes('etimedout')) return 'AI не успел ответить. Попробуйте ещё раз.';
  if (l.includes('econnrefused') || l.includes('enotfound') || l.includes('network')) return 'Не удалось связаться с YandexGPT.';
  if (l.includes('unauthorized') || l.includes('401') || l.includes('403') || l.includes('api-key')) return 'Проблема с API-ключом.';
  if (l.includes('429') || l.includes('rate limit')) return 'Слишком много запросов. Подождите минуту.';
  return `Не удалось сгенерировать тест. ${raw}`;
}

// ============================================================
// ОБРАБОТЧИК
// ============================================================
router.post('/generate-test', async (req, res) => {
  const { topic, subject = 'python', questionCount = 5, userId = 'anonymous' } = req.body;

  const API_KEY = process.env.YANDEX_API_KEY;
  const FOLDER_ID = process.env.YANDEX_FOLDER_ID;

  if (!API_KEY || !FOLDER_ID) return res.status(500).json({ error: 'Отсутствуют API-ключи YandexGPT' });

  const finalCount = Math.min(30, Math.max(1, parseInt(questionCount) || 1));
  const isMath = subject === 'math';
  const isRussian = subject === 'russian';
  const subjectName = isMath ? 'математике' : isRussian ? 'русскому языку' : 'Python';
  const subjectField = isMath ? 'math' : isRussian ? 'russian' : 'python';

  const seed = Math.floor(Math.random() * 1000000);
  const examKey = detectExam(topic);
  const examBlock = examKey
    ? `ФОРМАТ: ${EXAM_KNOWLEDGE[examKey]}`
    : `Тема: обычная школьная программа.`;

  let recentList = '';
  try {
    const recent = await AiGeneration.find({ userId }).sort({ createdAt: -1 }).limit(3).select('topic').lean();
    if (recent.length > 0) recentList = recent.map(r => `"${r.topic}"`).join(', ');
  } catch {}

  const russianType = isRussian ? detectRussianType(topic) : null;
  const systemMessage = isRussian ? buildRussianSystemMessage() : buildSystemMessage(isMath);
  const userPrompt = isRussian
    ? buildRussianUserPrompt({ topic, finalCount, examBlock, seed, recentList, russianType })
    : buildUserPrompt({ topic, subjectField, subjectName, isMath, finalCount, examBlock, seed, recentList });

  let totalUsage = { inputTokens: 0, completionTokens: 0, totalTokens: 0 };
  let verifyTokens = 0;
  let attempts = 0;
  let testData = null;

  const processResponse = (raw) => {
    let d = parseAiResponse(raw);
    d = deduplicateQuestions(d);
    d = removeExpressionBuilderForRussian(d, isRussian);
    d = normalizeTypes(d);
    d = normalizeCategories(d, isMath);
    d = cleanupOptions(d);
    d = normalizeStressFormat(d);
    d = normalizeOrthographyFormat(d, isRussian);
    d = normalizeTestStrings(d);
    d = unifyPlaceholders(d, isMath);
    d = normalizePlaceholderIds(d);
    d = stripLatexFromPython(d, isMath);
    d = wrapLatexInTestData(d, isMath);
    return d;
  };

  try {
    attempts = 1;
    let r1 = await callGPT(
      [{ role: 'system', text: systemMessage }, { role: 'user', text: userPrompt }],
      API_KEY, FOLDER_ID, 6000, 0.8
    );
    totalUsage.inputTokens += r1.usage.inputTokens;
    totalUsage.completionTokens += r1.usage.completionTokens;
    totalUsage.totalTokens += r1.usage.totalTokens;

    console.log('--- Attempt 1 ---');
    console.log(r1.text);

    testData = processResponse(r1.text);

    // ДОБОР: если после дедупликации вопросов меньше заказанного — добираем
    if (testData.questions.length < finalCount) {
      console.warn(`⚠️  После дедупликации ${testData.questions.length}/${finalCount}, запускаю top-up`);
      testData = await topUpToCount({
        testData, requestedCount: finalCount, systemMessage, userPrompt,
        API_KEY, FOLDER_ID, processResponse, totalUsage,
      });
    }

    let { critical, cosmetic } = validateTestData(testData, isMath, isRussian);

    if (cosmetic.length > 0) console.log('ℹ️  Косметика:', cosmetic);

    const verify1 = await verifyGroup(testData.questions, API_KEY, FOLDER_ID, isMath, isRussian);
    verifyTokens += verify1.tokens;
    totalUsage.totalTokens += verify1.tokens;

    if (verify1.invalidIndices.length > 0) {
      critical.push(`Вопросы ${verify1.invalidIndices.map(i => i + 1).join(', ')} — неверные.`);
    }

    const savedFirst = JSON.parse(JSON.stringify(testData));
    const savedFirstCritical = [...critical];

    if (critical.length > 0) {
      console.warn('⚠️  Критичные проблемы:', critical);
      attempts = 2;

      const retryPrompt = `${userPrompt}

❌ ОШИБКИ ПРЕДЫДУЩЕЙ ГЕНЕРАЦИИ:
${critical.map(i => '- ' + i).join('\n')}

🔴 ИСПРАВЬ и верни снова JSON.
⚠️ Количество вопросов должно быть РОВНО ${finalCount}. НЕ сокращай!
   Если не можешь решить какую-то тему — замени её на другую, но оставь ${finalCount} вопросов.
   Все вопросы должны быть РАЗНЫМИ.

ДЛЯ УДАРЕНИЙ:
- Формулировка ТОЛЬКО "В каком слове верно выделена буква, обозначающая ударный гласный звук?"
- В options РОВНО ОДНА заглавная буква на слово.
- БЕЗ звёздочек (**), БЕЗ подчёркиваний (_).
- 3 неправильных + 1 правильный вариант.

ДЛЯ expressionBuilder (математика):
- questionText: ТОЛЬКО задача с конкретными ЧИСЛАМИ.
- template: формула-ОТВЕТ с @@плейсхолдерами@@.
- placeholders[].expected: значения, требующие ВЫЧИСЛЕНИЯ (промежуточный результат или ответ), а НЕ числа из условия!

❌ Плохо: "Найдите объём куба с ребром 4" → template="V = @@a@@^3", expected="4"
✅ Хорошо: "Найдите объём куба с ребром 4" → template="V = @@V@@", expected="64"

ДЛЯ single/multiple (математика):
- Если уравнение имеет несколько корней (x²−9=0 → 3 и −3) — используй "multiple".
- Для "single" правильный ответ должен быть РОВНО ОДИН.`;

      try {
        const r2 = await callGPT(
          [{ role: 'system', text: systemMessage }, { role: 'user', text: retryPrompt }],
          API_KEY, FOLDER_ID, 6000, 0.8
        );
        totalUsage.inputTokens += r2.usage.inputTokens;
        totalUsage.completionTokens += r2.usage.completionTokens;
        totalUsage.totalTokens += r2.usage.totalTokens;

        console.log('--- Attempt 2 ---');
        console.log(r2.text);

        let testData2 = processResponse(r2.text);

        // ДОБОР и для второй попытки
        if (testData2.questions.length < finalCount) {
          console.warn(`⚠️  [Attempt 2] После дедупликации ${testData2.questions.length}/${finalCount}, запускаю top-up`);
          testData2 = await topUpToCount({
            testData: testData2, requestedCount: finalCount, systemMessage, userPrompt,
            API_KEY, FOLDER_ID, processResponse, totalUsage,
          });
        }

        const v2 = validateTestData(testData2, isMath, isRussian);
        const critical2 = [...v2.critical];

        if (v2.cosmetic.length > 0) console.log('ℹ️  Косметика #2:', v2.cosmetic);

        const verify2 = await verifyGroup(testData2.questions, API_KEY, FOLDER_ID, isMath, isRussian);
        verifyTokens += verify2.tokens;
        totalUsage.totalTokens += verify2.tokens;

        if (verify2.invalidIndices.length > 0) {
          critical2.push(`Q${verify2.invalidIndices.map(i => i + 1).join(', ')} — неверные.`);
        }

        // Сравниваем: выбираем вариант с меньшим числом critical + большим числом вопросов
        const score = (td, crit) => crit.length * 1000 - td.questions.length;
        if (score(testData2, critical2) <= score(savedFirst, savedFirstCritical)) {
          testData = testData2;
          critical = critical2;
        } else {
          testData = savedFirst;
          critical = savedFirstCritical;
        }

        if (critical.length > 0) console.warn('⚠️  Осталось:', critical);
        else console.log('✅ Тест валиден');
      } catch (e2) {
        console.warn('2-я попытка не удалась:', e2.message);
        testData = savedFirst;
      }
    }

    if (!testData?.questions?.length) throw new Error('Пустой список вопросов');

    testData.id = testData.id || Date.now().toString();
    testData.subject = testData.subject || subjectField;
    testData.questions = testData.questions.map((q, i) => ({ ...q, id: q.id || `q${i + 1}` }));

    try {
      await AiGeneration.create({
        userId, topic, subject: subjectField, questionCount: finalCount,
        attempts, inputTokens: totalUsage.inputTokens,
        completionTokens: totalUsage.completionTokens,
        totalTokens: totalUsage.totalTokens,
        verifyTokens, model: 'yandexgpt/latest', success: true,
      });
    } catch (dbErr) {
      console.error('Статистика:', dbErr.message);
    }

    res.json({ ...testData, _usage: { ...totalUsage, verifyTokens, attempts } });
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    const friendly = humanizeError(err);

    try {
      await AiGeneration.create({
        userId, topic, subject: subjectField, questionCount: finalCount,
        attempts: attempts || 1, inputTokens: totalUsage.inputTokens,
        completionTokens: totalUsage.completionTokens,
        totalTokens: totalUsage.totalTokens,
        verifyTokens, model: 'yandexgpt/latest', success: false,
        errorMessage: friendly,
      });
    } catch {}

    res.status(500).json({ error: friendly });
  }
});

// ============================================================
// СТАТИСТИКА
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const stats = await AiGeneration.aggregate([
      { $group: {
        _id: null,
        totalGenerations: { $sum: 1 },
        successful: { $sum: { $cond: ['$success', 1, 0] } },
        failed: { $sum: { $cond: ['$success', 0, 1] } },
        totalTokens: { $sum: '$totalTokens' },
        totalInputTokens: { $sum: '$inputTokens' },
        totalCompletionTokens: { $sum: '$completionTokens' },
        totalVerifyTokens: { $sum: '$verifyTokens' },
        avgTokensPerTest: { $avg: '$totalTokens' },
        avgAttempts: { $avg: '$attempts' },
      }},
    ]);
    res.json(stats[0] || { totalGenerations: 0, successful: 0, failed: 0, totalTokens: 0, totalInputTokens: 0, totalCompletionTokens: 0, totalVerifyTokens: 0, avgTokensPerTest: 0, avgAttempts: 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/history', async (req, res) => {
  try {
    const history = await AiGeneration.find().sort({ createdAt: -1 }).limit(20).lean();
    res.json(history);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;