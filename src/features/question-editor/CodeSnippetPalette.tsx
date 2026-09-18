import React from 'react';

interface CodeSnippetPaletteProps {
  onInsert: (code: string) => void;
}

interface Snippet {
  label: string;
  code: string;
}

interface Category {
  name: string;
  snippets: Snippet[];
}

const CATEGORIES: Category[] = [
  {
    name: 'Функции',
    snippets: [
      { label: 'def ...', code: 'def {{name}}({{params}}):\n    {{body}}' },
      { label: 'return', code: 'return {{value}}' },
      { label: 'lambda', code: 'lambda {{args}}: {{expression}}' },
    ],
  },
  {
    name: 'Условия',
    snippets: [
      { label: 'if ...', code: 'if {{condition}}:\n    {{body}}' },
      { label: 'if/else', code: 'if {{condition}}:\n    {{body}}\nelse:\n    {{else_body}}' },
      { label: 'elif', code: 'elif {{condition}}:\n    {{body}}' },
    ],
  },
  {
    name: 'Циклы',
    snippets: [
      { label: 'for ...', code: 'for {{item}} in {{collection}}:\n    {{body}}' },
      { label: 'for range', code: 'for {{i}} in range({{n}}):\n    {{body}}' },
      { label: 'while', code: 'while {{condition}}:\n    {{body}}' },
      { label: 'break', code: 'break' },
      { label: 'continue', code: 'continue' },
    ],
  },
  {
    name: 'Коллекции',
    snippets: [
      { label: 'list', code: '[{{item1}}, {{item2}}, {{item3}}]' },
      { label: 'dict', code: '{"{{key}}": {{value}}}' },
      { label: 'set', code: '{ {{item1}}, {{item2}} }' },
      { label: 'tuple', code: '({{item1}}, {{item2}})' },
    ],
  },
  {
    name: 'Классы / исключения',
    snippets: [
      { label: 'class', code: 'class {{Name}}:\n    def __init__(self, {{args}}):\n        {{body}}' },
      { label: 'try/except', code: 'try:\n    {{body}}\nexcept {{Exception}} as {{e}}:\n    {{handler}}' },
      { label: 'with', code: 'with {{resource}} as {{var}}:\n    {{body}}' },
    ],
  },
];

export const CodeSnippetPalette: React.FC<CodeSnippetPaletteProps> = ({ onInsert }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <div className="p-3 space-y-3">
        {CATEGORIES.map(cat => (
          <div key={cat.name}>
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {cat.name}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {cat.snippets.map((snip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onInsert(snip.code)}
                  title={snip.code}
                  className="px-2.5 py-1.5 text-xs font-mono bg-white border border-gray-200 rounded-md hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {snip.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};