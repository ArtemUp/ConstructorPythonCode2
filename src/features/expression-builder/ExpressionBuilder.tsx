import React, { useMemo, useState } from 'react';
import { Item, Placeholder } from '@entities/test/types';
import hljs from 'highlight.js';
import katex from 'katex';
import { Package, Wrench, X, CheckCircle2, AlertCircle, Hand } from 'lucide-react';
import { cleanLatex } from '@/shared/lib/latex';
import '@/app/styles/custom-highlight.css';
import 'katex/dist/katex.min.css';

interface ExpressionBuilderProps {
  template: string;
  placeholders: Placeholder[];
  availableItems: Item[];
  value: Record<string, Item | null>;
  onChange: (value: Record<string, Item | null>) => void;
  subject?: 'python' | 'math';
  onValidate?: (isValid: boolean) => void;
}

export const ExpressionBuilder: React.FC<ExpressionBuilderProps> = ({
  template,
  placeholders,
  availableItems,
  value,
  onChange,
  subject = 'python',
}) => {
  const isPython = subject === 'python';

  // Выбранный элемент (для тап-режима)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Оставшиеся элементы (не использованные)
  const remainingItems = useMemo(() => {
    const usedItemIds = Object.values(value)
      .filter((item): item is Item => item !== null)
      .map(item => item.id);
    return availableItems.filter(item => !usedItemIds.includes(item.id));
  }, [availableItems, value]);

  const categories = useMemo(
    () => Array.from(new Set(remainingItems.map(i => i.category))),
    [remainingItems]
  );

  // ============================================================
  // ИТОГОВОЕ ВЫРАЖЕНИЕ — поддерживает @@id@@ и {{id}}
  // ============================================================
  const builtCode = useMemo(() => {
  let result = template;
  placeholders.forEach(ph => {
    const item = value[ph.id];
    const content = item ? item.content : `[${ph.id}]`;
    // {{id}} — Python
    result = result.replace(new RegExp(`\\{\\{${ph.id}\\}\\}`, 'g'), content);
    // @@id@@ — математика
    result = result.replace(new RegExp(`@@${ph.id}@@`, 'g'), content);
  });
  return result;
}, [template, value, placeholders]);

  // Подсветка Python
  const pythonHtml = useMemo(() => {
    if (!isPython) return '';
    return hljs.highlight(builtCode, { language: 'python' }).value;
  }, [builtCode, isPython]);

  // Рендер математики
  const mathHtml = useMemo(() => {
    if (isPython) return '';
    const latex = cleanLatex(builtCode);
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode: true });
    } catch {
      return builtCode;
    }
  }, [builtCode, isPython]);

  // ============ DRAG & DROP (для десктопа) ============
  const handleDragStart = (e: React.DragEvent, item: Item) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
  };

  const handleDrop = (e: React.DragEvent, placeholderId: string) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    const item = JSON.parse(raw) as Item;
    if (remainingItems.some(i => i.id === item.id)) {
      onChange({ ...value, [placeholderId]: item });
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  // ============ ТАП-РЕЖИМ (для мобильных) ============
  const handleItemClick = (item: Item) => {
    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
    }
  };

  const handlePlaceholderClick = (placeholderId: string) => {
    if (selectedItem) {
      onChange({ ...value, [placeholderId]: selectedItem });
      setSelectedItem(null);
      return;
    }
    if (value[placeholderId]) {
      onChange({ ...value, [placeholderId]: null });
    }
  };

  const handleRemoveFromPlaceholder = (
    e: React.MouseEvent,
    placeholderId: string
  ) => {
    e.stopPropagation();
    if (value[placeholderId]) {
      onChange({ ...value, [placeholderId]: null });
    }
  };

  const allFilled = useMemo(
    () => placeholders.every(ph => !!value[ph.id]),
    [value, placeholders]
  );

  const emptyCount = placeholders.filter(p => !value[p.id]).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* ==================== КОРЗИНА ==================== */}
      <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {isPython ? 'Элементы Python' : 'Элементы математики'}
            </h3>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Hand className="w-3 h-3" />
              Тапните элемент, затем поле
            </p>
          </div>
        </div>

        <div className="space-y-4 max-h-[400px] lg:max-h-none overflow-y-auto pr-1">
          {categories.map(category => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {category}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="flex flex-wrap gap-2">
                {remainingItems
                  .filter(i => i.category === category)
                  .map(item => {
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        draggable
                        onDragStart={e => handleDragStart(e, item)}
                        onClick={() => handleItemClick(item)}
                        className={`px-3 py-2 text-sm font-mono rounded-lg cursor-move transition-all border-2 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105'
                            : 'bg-gray-50 text-gray-800 border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {item.content}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}

          {remainingItems.length === 0 && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-500">Все элементы использованы</p>
            </div>
          )}
        </div>

        {selectedItem && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            Выбран: <b className="font-mono">{selectedItem.content}</b>. Теперь тапните по нужному полю.
          </div>
        )}
      </div>

      {/* ==================== ОБЛАСТЬ СБОРКИ ==================== */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Wrench className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {isPython ? 'Соберите код Python' : 'Соберите выражение'}
            </h3>
            <p className="text-xs text-gray-500">Заполните все плейсхолдеры</p>
          </div>
        </div>

        {/* Результат сборки */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Результат
          </p>

          {isPython ? (
            <div className="rounded-lg overflow-hidden border border-gray-800">
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
                  dangerouslySetInnerHTML={{ __html: pythonHtml }}
                />
              </pre>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 min-h-[80px] flex items-center justify-center overflow-x-auto">
              <div
                className="text-center"
                dangerouslySetInnerHTML={{ __html: mathHtml }}
              />
            </div>
          )}
        </div>

        {/* Плейсхолдеры */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Поля для заполнения
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {placeholders.map(ph => {
              const filled = value[ph.id];
              const canInsert = selectedItem && !filled;
              return (
                <div
                  key={ph.id}
                  onDrop={e => handleDrop(e, ph.id)}
                  onDragOver={handleDragOver}
                  onClick={() => handlePlaceholderClick(ph.id)}
                  className={`relative border-2 border-dashed rounded-lg p-3 min-h-[64px] flex items-center justify-center transition-all cursor-pointer ${
                    filled
                      ? 'bg-blue-50 border-blue-300'
                      : canInsert
                      ? 'border-blue-500 bg-blue-50 shadow-md animate-pulse'
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                  }`}
                >
                  {filled ? (
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="font-mono text-sm text-blue-700 truncate">
                        {filled.content}
                      </span>
                      <button
                        type="button"
                        onClick={e => handleRemoveFromPlaceholder(e, ph.id)}
                        className="flex-shrink-0 p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-gray-400 text-xs font-mono mb-0.5">
                        ? {ph.id} ?
                      </div>
                      <div className="text-[10px] text-gray-300 uppercase tracking-wide">
                        {ph.expectedType}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Статус-бар */}
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border ${
            allFilled
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          {allFilled ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800">
                Все поля заполнены. Можете перейти к следующему вопросу.
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-800">
                Заполните все поля — осталось: <b>{emptyCount}</b>
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};