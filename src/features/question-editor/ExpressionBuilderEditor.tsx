import React, { useMemo, useRef } from 'react';
import { Plus, Trash2, Wand2, Info, Eye } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { MathSymbolPalette } from './MathSymbolPalette';
import { CodeSnippetPalette } from './CodeSnippetPalette';

type Subject = 'python' | 'math';

interface Placeholder {
  id: string;
  expectedType: string;
  expected: string;
}

interface AvailableItem {
  id: string;
  content: string;
  category: string;
}

interface ExpressionBuilderEditorProps {
  questionText: string;
  template: string;
  placeholders: Placeholder[];
  availableItems: AvailableItem[];
  subject?: Subject;
  onChange: (patch: {
    questionText?: string;
    template?: string;
    placeholders?: Placeholder[];
    availableItems?: AvailableItem[];
  }) => void;
}

const CATEGORIES: Record<Subject, { value: string; label: string }[]> = {
  python: [
    { value: 'keyword', label: 'Ключевое слово' },
    { value: 'identifier', label: 'Идентификатор' },
    { value: 'operator', label: 'Оператор' },
    { value: 'separator', label: 'Разделитель' },
    { value: 'builtin', label: 'Встроенная функция' },
  ],
  math: [
    { value: 'symbol', label: 'Символ' },
    { value: 'function', label: 'Функция' },
    { value: 'variable', label: 'Переменная' },
    { value: 'operator', label: 'Оператор' },
    { value: 'number', label: 'Число' },
  ],
};

const DEFAULT_TYPES: Record<Subject, string[]> = {
  python: ['keyword', 'identifier', 'operator', 'separator', 'builtin'],
  math: ['symbol', 'function', 'variable', 'operator', 'number'],
};

export const ExpressionBuilderEditor: React.FC<ExpressionBuilderEditorProps> = ({
  questionText,
  template,
  placeholders,
  availableItems,
  subject = 'python',
  onChange,
}) => {
  const templateRef = useRef<HTMLTextAreaElement>(null);

  // Автодетект плейсхолдеров
  const detectedPlaceholders = useMemo(() => {
    const found: string[] = [];
    let m: RegExpExecArray | null;

    // {{id}} — Python
    const re1 = /{{(\w+)}}/g;
    while ((m = re1.exec(template)) !== null) {
        if (!found.includes(m[1])) found.push(m[1]);
    }

    // @@id@@ — математика
    const re2 = /@@(\w+)@@/g;
    while ((m = re2.exec(template)) !== null) {
        if (!found.includes(m[1])) found.push(m[1]);
    }

    return found;
   }, [template]);

  // Синхронизация
  React.useEffect(() => {
    const currentIds = placeholders.map(p => p.id).join(',');
    const detectedIds = detectedPlaceholders.join(',');
    if (currentIds !== detectedIds) {
      const updated: Placeholder[] = detectedPlaceholders.map(id => {
        const existing = placeholders.find(p => p.id === id);
        return existing || { id, expectedType: DEFAULT_TYPES[subject][0], expected: '' };
      });
      onChange({ placeholders: updated });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedPlaceholders]);

  // === Вставка текста в позицию курсора ===
  const insertAtCursor = (text: string) => {
    const textarea = templateRef.current;
    if (!textarea) {
      // fallback — просто добавляем в конец
      onChange({ template: template + text });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = template.slice(0, start) + text + template.slice(end);

    onChange({ template: newValue });

    // Восстанавливаем курсор после вставки
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + text.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  // === Live-превью шаблона ===
  const previewHtml = useMemo(() => {
    if (!template.trim()) return '';
    let preview = template
        .replace(/{{(\w+)}}/g, '[ $1 ]')    // Python
        .replace(/@@(\w+)@@/g, '[ $1 ]');   // Математика

    if (subject === 'math') {
      try {
        return katex.renderToString(preview, {
          throwOnError: false,
          displayMode: true,
        });
      } catch {
        return preview;
      }
    }
    // Для Python — просто текст
    return null;
  }, [template, subject]);

  const handlePlaceholderChange = (id: string, patch: Partial<Placeholder>) => {
    onChange({
      placeholders: placeholders.map(p => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  const handleAddItem = () => {
    onChange({
      availableItems: [
        ...availableItems,
        {
          id: `item_${Date.now()}`,
          content: '',
          category: DEFAULT_TYPES[subject][0],
        },
      ],
    });
  };

  const handleItemChange = (id: string, patch: Partial<AvailableItem>) => {
    onChange({
      availableItems: availableItems.map(it => (it.id === id ? { ...it, ...patch } : it)),
    });
  };

  const handleRemoveItem = (id: string) => {
    onChange({ availableItems: availableItems.filter(it => it.id !== id) });
  };

  const handleAutoFillItems = () => {
    const newItems: AvailableItem[] = [];
    const usedContents = new Set(availableItems.map(i => i.content));

    placeholders.forEach(ph => {
      if (ph.expected && !usedContents.has(ph.expected)) {
        newItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          content: ph.expected,
          category: ph.expectedType || DEFAULT_TYPES[subject][0],
        });
        usedContents.add(ph.expected);
      }
    });

    if (newItems.length > 0) {
      onChange({ availableItems: [...availableItems, ...newItems] });
    } else {
      alert('Все ожидаемые значения уже добавлены в корзину');
    }
  };

  const allFilled =
    placeholders.length > 0 && placeholders.every(p => p.expected.trim() !== '');

  return (
    <div className="space-y-5">
      {/* Текст вопроса */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Текст вопроса
        </label>
        <textarea
          rows={2}
          value={questionText}
          onChange={e => onChange({ questionText: e.target.value })}
          placeholder={
            subject === 'math'
              ? 'Например: Вычислите значение выражения'
              : 'Например: Соберите определение функции сложения'
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Шаблон + палитра */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700">
            Шаблон {subject === 'python' ? 'кода' : 'выражения'}
          </label>
          <span className="text-xs text-gray-400">
            Используйте {'{{имя}}'} для плейсхолдеров
          </span>
        </div>

        {/* Палитра */}
        {subject === 'math' ? (
          <MathSymbolPalette onInsert={insertAtCursor} />
        ) : (
          <CodeSnippetPalette onInsert={insertAtCursor} />
        )}

        {/* Поле шаблона */}
        <textarea
          ref={templateRef}
          rows={subject === 'python' ? 5 : 3}
          value={template}
          onChange={e => onChange({ template: e.target.value })}
          placeholder={
            subject === 'python'
              ? 'def {{name}}({{a}}, {{b}}):\n    return {{a}} {{op}} {{b}}'
              : 'Кликните на символ выше или введите формулу вручную'
          }
          className="mt-2 w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Live-превью */}
        {template.trim() && (
          <div className="mt-2">
            <div className="flex items-center gap-1.5 mb-1 text-xs text-gray-500">
              <Eye className="w-3.5 h-3.5" />
              Предпросмотр
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg overflow-x-auto min-h-[50px] flex items-center justify-center">
              {subject === 'math' && previewHtml ? (
                <div
                  className="text-center"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap text-left w-full">
                  {template.replace(/{{(\w+)}}/g, '[ $1 ]')}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Подсказка */}
      <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          {subject === 'math'
            ? 'Кликните на символ — он вставится в позицию курсора. Все {{плейсхолдеры}} появятся ниже автоматически.'
            : 'Выберите шаблон кода — он вставится в позицию курсора. Замените {{параметры}} при необходимости.'}
        </div>
      </div>

      {/* Плейсхолдеры */}
      {detectedPlaceholders.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Плейсхолдеры ({detectedPlaceholders.length})
          </label>
          <div className="space-y-2">
            {placeholders.map(ph => (
              <div key={ph.id} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 rounded">
                    {`{{${ph.id}}}`}
                  </span>
                </div>
                <div className="col-span-4">
                  <input
                    type="text"
                    value={ph.expected}
                    onChange={e =>
                      handlePlaceholderChange(ph.id, { expected: e.target.value })
                    }
                    placeholder="Ожидаемое значение"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-5">
                  <select
                    value={ph.expectedType}
                    onChange={e =>
                      handlePlaceholderChange(ph.id, { expectedType: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {CATEGORIES[subject].map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Элементы корзины */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Элементы в корзине ({availableItems.length})
          </label>
          <div className="flex items-center gap-2">
            {allFilled && (
              <button
                type="button"
                onClick={handleAutoFillItems}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Автозаполнить
              </button>
            )}
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          </div>
        </div>

        {availableItems.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-400">
              Пока пусто. Добавьте элементы или нажмите «Автозаполнить».
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableItems.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.content}
                  onChange={e => handleItemChange(item.id, { content: e.target.value })}
                  placeholder="Содержимое"
                  className="flex-1 px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={item.category}
                  onChange={e =>
                    handleItemChange(item.id, { category: e.target.value })
                  }
                  className="w-44 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {CATEGORIES[subject].map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.value}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};