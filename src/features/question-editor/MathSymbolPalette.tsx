import React, { useState } from 'react';

interface MathSymbolPaletteProps {
  onInsert: (latex: string) => void;
  /**
   * 'placeholder' — для expressionBuilder: вставляет {{x}}, {{num}}...
   * 'plain' — для single/multiple: вставляет чистый LaTeX без placeholder'ов
   */
  mode?: 'placeholder' | 'plain';
}

type Tab = 'basic' | 'fractions' | 'roots' | 'vectors' | 'calculus' | 'greek';

const TABS: { value: Tab; label: string }[] = [
  { value: 'basic', label: 'Основные' },
  { value: 'fractions', label: 'Степени' },
  { value: 'roots', label: 'Корни' },
  { value: 'vectors', label: 'Геометрия' },
  { value: 'calculus', label: 'Интегралы' },
  { value: 'greek', label: 'Греческие' },
];

const SYMBOLS: Record<Tab, { label: string; latex: string; insertText: string }[]> = {
  basic: [
    { label: '+', latex: '+', insertText: ' + ' },
    { label: '−', latex: '-', insertText: ' - ' },
    { label: '×', latex: '\\cdot', insertText: ' \\cdot ' },
    { label: '÷', latex: '\\div', insertText: ' \\div ' },
    { label: '=', latex: '=', insertText: ' = ' },
    { label: '≠', latex: '\\ne', insertText: ' \\ne ' },
    { label: '≤', latex: '\\le', insertText: ' \\le ' },
    { label: '≥', latex: '\\ge', insertText: ' \\ge ' },
    { label: '±', latex: '\\pm', insertText: ' \\pm ' },
    { label: '∞', latex: '\\infty', insertText: '\\infty' },
    { label: '→', latex: '\\to', insertText: ' \\to ' },
    { label: '⇒', latex: '\\Rightarrow', insertText: ' \\Rightarrow ' },
  ],
  fractions: [
    { label: 'x²', latex: 'x^{2}', insertText: '{{base}}^{{{power}}}' },
    { label: 'xₙ', latex: 'x_{n}', insertText: '{{base}}_{{{index}}}' },
    { label: 'a/b', latex: '\\frac{a}{b}', insertText: '\\frac{{{num}}}{{{den}}}' },
    { label: 'sin', latex: '\\sin', insertText: '\\sin ' },
    { label: 'cos', latex: '\\cos', insertText: '\\cos ' },
    { label: 'tan', latex: '\\tan', insertText: '\\tan ' },
    { label: 'log', latex: '\\log', insertText: '\\log ' },
    { label: 'ln', latex: '\\ln', insertText: '\\ln ' },
    { label: '|x|', latex: '|x|', insertText: '|{{x}}|' },
  ],
  roots: [
    { label: '√', latex: '\\sqrt{x}', insertText: '\\sqrt{{{x}}}' },
    { label: '³√', latex: '\\sqrt[3]{x}', insertText: '\\sqrt[3]{{{x}}}' },
    { label: 'ⁿ√', latex: '\\sqrt[n]{x}', insertText: '\\sqrt[{{n}}]{{{x}}}' },
  ],
  vectors: [
    { label: '→AB', latex: '\\vec{AB}', insertText: '\\vec{{{AB}}}' },
    { label: '|AB|', latex: '|AB|', insertText: '|{{AB}}|' },
    { label: '∠ABC', latex: '\\angle ABC', insertText: '\\angle {{ABC}}' },
    { label: '△ABC', latex: '\\triangle ABC', insertText: '\\triangle {{ABC}}' },
    { label: '⊥', latex: '\\perp', insertText: ' \\perp ' },
    { label: '∥', latex: '\\parallel', insertText: ' \\parallel ' },
    { label: '°', latex: '^\\circ', insertText: '^\\circ' },
    { label: 'π', latex: '\\pi', insertText: '\\pi' },
  ],
  calculus: [
    { label: '∫', latex: '\\int', insertText: '\\int ' },
    { label: '∫ᵃᵇ', latex: '\\int_{a}^{b}', insertText: '\\int_{{{a}}}^{{{b}}} ' },
    { label: '∑', latex: '\\sum', insertText: '\\sum ' },
    { label: '∏', latex: '\\prod', insertText: '\\prod ' },
    { label: 'lim', latex: '\\lim', insertText: '\\lim_{{{x \\to 0}}} ' },
    { label: "f'(x)", latex: "f'(x)", insertText: "{{f}}'\\left({{x}}\\right)" },
    { label: '∂', latex: '\\partial', insertText: '\\partial ' },
    { label: 'd/dx', latex: '\\frac{d}{dx}', insertText: '\\frac{d}{d{{x}}}' },
  ],
  greek: [
    { label: 'α', latex: '\\alpha', insertText: '\\alpha ' },
    { label: 'β', latex: '\\beta', insertText: '\\beta ' },
    { label: 'γ', latex: '\\gamma', insertText: '\\gamma ' },
    { label: 'δ', latex: '\\delta', insertText: '\\delta ' },
    { label: 'θ', latex: '\\theta', insertText: '\\theta ' },
    { label: 'λ', latex: '\\lambda', insertText: '\\lambda ' },
    { label: 'μ', latex: '\\mu', insertText: '\\mu ' },
    { label: 'π', latex: '\\pi', insertText: '\\pi ' },
    { label: 'σ', latex: '\\sigma', insertText: '\\sigma ' },
    { label: 'φ', latex: '\\varphi', insertText: '\\varphi ' },
    { label: 'ω', latex: '\\omega', insertText: '\\omega ' },
    { label: 'Δ', latex: '\\Delta', insertText: '\\Delta ' },
    { label: 'Σ', latex: '\\Sigma', insertText: '\\Sigma ' },
  ],
};

// Убираем placeholder'ы: \sqrt{{{x}}} → \sqrt{x}
function stripPlaceholders(text: string): string {
  return text.replace(/{{(\w+)}}/g, '$1');
}

export const MathSymbolPalette: React.FC<MathSymbolPaletteProps> = ({
  onInsert,
  mode = 'placeholder',
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('basic');

  const handleClick = (sym: { insertText: string }) => {
    onInsert(mode === 'plain' ? stripPlaceholders(sym.insertText) : sym.insertText);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      {/* Вкладки */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-white">
        {TABS.map(tab => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.value
                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Символы */}
      <div className="p-3 flex flex-wrap gap-1.5 max-h-[240px] overflow-y-auto">
        {SYMBOLS[activeTab].map((sym, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleClick(sym)}
            title={`Вставить: ${sym.latex}`}
            className="inline-flex items-center justify-center min-w-[44px] h-9 px-2 text-sm bg-white border border-gray-200 rounded-md hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <span className="font-mono text-xs">{sym.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};