import React, { useState } from 'react';

interface PythonSymbolPaletteProps {
  onInsert: (text: string) => void;
}

type Tab = 'keywords' | 'builtins' | 'operators' | 'types' | 'methods' | 'symbols';

const TABS: { value: Tab; label: string }[] = [
  { value: 'keywords', label: 'Ключевые' },
  { value: 'builtins', label: 'Встроенные' },
  { value: 'operators', label: 'Операторы' },
  { value: 'types', label: 'Типы' },
  { value: 'methods', label: 'Методы строк' },
  { value: 'symbols', label: 'Символы' },
];

const ITEMS: Record<Tab, string[]> = {
  keywords: [
    'def', 'return', 'if', 'elif', 'else', 'for', 'while',
    'break', 'continue', 'pass', 'import', 'from', 'as',
    'class', 'try', 'except', 'finally', 'with', 'lambda',
    'yield', 'global', 'nonlocal', 'assert', 'del', 'raise',
    'in', 'is', 'not', 'and', 'or', 'None', 'True', 'False',
  ],
  builtins: [
    'print', 'len', 'range', 'input', 'int', 'str', 'float',
    'list', 'dict', 'set', 'tuple', 'bool', 'sum', 'min', 'max',
    'abs', 'round', 'sorted', 'reversed', 'enumerate', 'zip',
    'map', 'filter', 'type', 'isinstance', 'open', 'help',
  ],
  operators: [
    '+', '-', '*', '/', '//', '%', '**',
    '==', '!=', '<', '>', '<=', '>=', '=',
    '+=', '-=', '*=', '/=', '//=', '%=', '**=',
    'and', 'or', 'not', 'in', 'is',
  ],
  types: [
    'int', 'str', 'float', 'bool',
    'list', 'dict', 'set', 'tuple',
    'None', 'object', 'bytes',
  ],
  methods: [
    '.upper()', '.lower()', '.strip()', '.split()', '.join()',
    '.replace()', '.find()', '.startswith()', '.endswith()',
    '.format()', '.count()', '.index()', '.append()',
    '.insert()', '.remove()', '.pop()', '.sort()', '.keys()',
    '.values()', '.items()', '.get()', '.update()',
  ],
  symbols: [
    '(', ')', '[', ']', '{', '}', ':', ',', ';', '.',
    '"', "'", '_', '=', '@', '#', '\\n', '\\t', '->',
  ],
};

export const PythonSymbolPalette: React.FC<PythonSymbolPaletteProps> = ({ onInsert }) => {
  const [activeTab, setActiveTab] = useState<Tab>('keywords');

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

      {/* Элементы */}
      <div className="p-3 flex flex-wrap gap-1.5 max-h-[240px] overflow-y-auto">
        {ITEMS[activeTab].map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onInsert(item)}
            title={`Вставить: ${item}`}
            className="inline-flex items-center justify-center min-h-[34px] px-2.5 py-1 text-xs font-mono bg-white border border-gray-200 rounded-md hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};