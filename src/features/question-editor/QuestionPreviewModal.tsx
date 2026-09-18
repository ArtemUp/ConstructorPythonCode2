import React, { useState } from 'react';
import { X, Eye } from 'lucide-react';
import { RichText } from '@shared/ui/RichText';
import { ExpressionBuilder } from '@features/expression-builder/ExpressionBuilder';

type Subject = 'python' | 'math';

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'expressionBuilder';
  questionText: string;
  options?: string[];
  correctAnswers?: string[];
  template?: string;
  placeholders?: { id: string; expectedType: string; expected: string }[];
  availableItems?: { id: string; content: string; category: string }[];
}

interface QuestionPreviewModalProps {
  question: Question;
  subject?: Subject;
  isOpen: boolean;
  onClose: () => void;
}

export const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({
  question,
  subject = 'python',
  isOpen,
  onClose,
}) => {
  const [singleValue, setSingleValue] = useState<string | null>(null);
  const [multipleValue, setMultipleValue] = useState<string[]>([]);
  const [builderValue, setBuilderValue] = useState<Record<string, any>>({});

  if (!isOpen) return null;

  const handleClose = () => {
    setSingleValue(null);
    setMultipleValue([]);
    setBuilderValue({});
    onClose();
  };

  const renderQuestion = () => {
    if (question.type === 'single') {
      return (
        <div className="space-y-3">
          {(question.options || []).map((opt, idx) => (
            <label
              key={idx}
              className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <input
                type="radio"
                name={`preview_${question.id}`}
                checked={singleValue === opt}
                onChange={() => setSingleValue(opt)}
                className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-800 break-words">
                <RichText text={opt} light />
              </span>
            </label>
          ))}
        </div>
      );
    }

    if (question.type === 'multiple') {
      return (
        <div className="space-y-3">
          {(question.options || []).map((opt, idx) => {
            const checked = multipleValue.includes(opt);
            const toggle = () => {
              setMultipleValue(prev =>
                checked ? prev.filter(v => v !== opt) : [...prev, opt]
              );
            };
            return (
              <label
                key={idx}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={toggle}
                  className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-sm text-gray-800 break-words">
                  <RichText text={opt} light />
                </span>
              </label>
            );
          })}
        </div>
      );
    }

    if (question.type === 'expressionBuilder') {
      if (!question.template || !question.placeholders || !question.availableItems) {
        return (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Заполните шаблон, плейсхолдеры и элементы корзины, чтобы увидеть предпросмотр.
          </div>
        );
      }
      return (
        <ExpressionBuilder
          template={question.template}
          placeholders={question.placeholders}
          availableItems={question.availableItems}
          value={builderValue}
          onChange={setBuilderValue}
          subject={subject}
        />
      );
    }

    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 md:p-6 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900">
                Предпросмотр вопроса
              </h2>
              <p className="text-xs text-gray-500">Так его увидит ученик</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 max-h-[75vh] overflow-y-auto">
          <div className="mb-5">
            <RichText
              text={question.questionText || 'Вопрос без текста'}
              light
              className="text-base md:text-lg font-semibold text-gray-900 leading-snug"
            />
          </div>

          {renderQuestion()}

          <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 text-center">
            Это интерактивный предпросмотр — можно кликать и перетаскивать, чтобы понять,
            как вопрос работает для ученика.
          </div>
        </div>
      </div>
    </div>
  );
};