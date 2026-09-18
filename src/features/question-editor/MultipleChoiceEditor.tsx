import React, { useRef } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { SymbolInsertButton } from './SymbolInsertButton';

type Subject = 'python' | 'math';

interface MultipleChoiceEditorProps {
  questionText: string;
  options: string[];
  correctAnswers: string[];
  subject?: Subject;
  onChange: (patch: {
    questionText?: string;
    options?: string[];
    correctAnswers?: string[];
  }) => void;
}

export const MultipleChoiceEditor: React.FC<MultipleChoiceEditorProps> = ({
  questionText,
  options,
  correctAnswers,
  subject = 'python',
  onChange,
}) => {
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);

  const insertIntoQuestion = (text: string) => {
    const el = questionRef.current;
    if (!el) {
      onChange({ questionText: questionText + text });
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const newValue = questionText.slice(0, start) + text + questionText.slice(end);
    onChange({ questionText: newValue });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const insertIntoOption = (idx: number, text: string) => {
    const el = optionRefs.current[idx];
    const value = options[idx] || '';
    if (!el) {
      handleOptionChange(idx, value + text);
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const newValue = value.slice(0, start) + text + value.slice(end);
    handleOptionChange(idx, newValue);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleOptionChange = (idx: number, value: string) => {
    const oldValue = options[idx];
    const newOptions = [...options];
    newOptions[idx] = value;

    const newCorrect = correctAnswers.map(c => (c === oldValue ? value : c));
    onChange({ options: newOptions, correctAnswers: newCorrect });
  };

  const handleAddOption = () => {
    onChange({ options: [...options, ''] });
  };

  const handleRemoveOption = (idx: number) => {
    const removedText = options[idx];
    const newOptions = options.filter((_, i) => i !== idx);
    const newCorrect = correctAnswers.filter(c => c !== removedText);
    onChange({ options: newOptions, correctAnswers: newCorrect });
  };

  const toggleCorrect = (text: string) => {
    if (!text) return;
    const isSelected = correctAnswers.includes(text);
    const newCorrect = isSelected
      ? correctAnswers.filter(c => c !== text)
      : [...correctAnswers, text];
    onChange({ correctAnswers: newCorrect });
  };

  const isMath = subject === 'math';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Текст вопроса
        </label>
        <div className="flex items-start gap-2">
          <textarea
            ref={questionRef}
            rows={2}
            value={questionText}
            onChange={e => onChange({ questionText: e.target.value })}
            placeholder={
              isMath
                ? 'Например: Какие из чисел являются корнями $x^2 = 9$?'
                : 'Например: Какие операторы используются в Python?'
            }
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <SymbolInsertButton subject={subject} onInsert={insertIntoQuestion} />
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          {isMath
            ? 'Формулы оборачивайте в $...$ (например, $x^2 + 1$)'
            : 'Код и ключевые слова можно вставлять без обёртки'}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Варианты ответа
          </label>
          <span className="text-xs text-gray-400">
            Отметьте правильные варианты ☑
          </span>
        </div>

        <div className="space-y-2">
          {options.map((opt, idx) => {
            const isCorrect = correctAnswers.includes(opt) && opt !== '';
            return (
              <div key={idx} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleCorrect(opt)}
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isCorrect
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                  title="Отметить как правильный"
                >
                  {isCorrect && <Check className="w-3 h-3 text-white" />}
                </button>

                <input
                  ref={el => (optionRefs.current[idx] = el)}
                  type="text"
                  value={opt}
                  onChange={e => handleOptionChange(idx, e.target.value)}
                  placeholder={`Вариант ${idx + 1}`}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <SymbolInsertButton
                  subject={subject}
                  onInsert={text => insertIntoOption(idx, text)}
                />

                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  disabled={options.length <= 2}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAddOption}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить вариант
        </button>
      </div>
    </div>
  );
};