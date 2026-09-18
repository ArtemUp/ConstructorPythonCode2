import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  ArrowUp,
  ArrowDown,
  Code2,
  ListChecks,
  CheckSquare,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { SingleChoiceEditor } from './SingleChoiceEditor';
import { MultipleChoiceEditor } from './MultipleChoiceEditor';
import { ExpressionBuilderEditor } from './ExpressionBuilderEditor';
import { QuestionPreviewModal } from './QuestionPreviewModal';

type QuestionType = 'single' | 'multiple' | 'expressionBuilder';
type Subject = 'python' | 'math';

interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: string[];
  correctAnswers?: string[];
  template?: string;
  placeholders?: { id: string; expectedType: string; expected: string }[];
  availableItems?: { id: string; content: string; category: string }[];
}

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  subject?: Subject;
  onChange: (patch: Partial<Question>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  single: 'Одиночный выбор',
  multiple: 'Множественный выбор',
  expressionBuilder: 'Сборка выражения',
};

const TYPE_ICONS: Record<QuestionType, React.ElementType> = {
  single: ListChecks,
  multiple: CheckSquare,
  expressionBuilder: Code2,
};

const TYPE_COLORS: Record<QuestionType, string> = {
  single: 'bg-blue-100 text-blue-700',
  multiple: 'bg-purple-100 text-purple-700',
  expressionBuilder: 'bg-emerald-100 text-emerald-700',
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  total,
  subject = 'python',
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  const TypeIcon = TYPE_ICONS[question.type];
  const canPreview = String(question.questionText || '').trim().length > 0;

  const validation = React.useMemo(() => {
    const issues: string[] = [];

    if (!String(question.questionText || '').trim()) {
      issues.push('Не заполнен текст вопроса');
    }

    if (question.type === 'single') {
      const opts = (question.options || []).filter(o => String(o || '').trim());
      if (opts.length < 2) issues.push('Нужно минимум 2 варианта ответа');
      if (!question.correctAnswers?.[0]) issues.push('Не выбран правильный ответ');
    }

    if (question.type === 'multiple') {
      const opts = (question.options || []).filter(o => String(o || '').trim());
      if (opts.length < 2) issues.push('Нужно минимум 2 варианта ответа');
      if (!question.correctAnswers?.length) issues.push('Не выбраны правильные ответы');
    }

    if (question.type === 'expressionBuilder') {
      if (!String(question.template || '').trim()) issues.push('Не заполнен шаблон');
      const ph = question.placeholders || [];
      if (ph.length === 0) issues.push('Нет плейсхолдеров в шаблоне');
      if (ph.some(p => !String(p.expected ?? '').trim()))
        issues.push('Не у всех плейсхолдеров указано ожидаемое');
      const items = question.availableItems || [];
      if (items.length === 0) issues.push('Корзина пустая');
    }

    return issues;
  }, [question]);

  const isValid = validation.length === 0;

  const preview = question.questionText
    ? question.questionText.length > 70
      ? question.questionText.slice(0, 70) + '…'
      : question.questionText
    : '(текст не заполнен)';

  return (
    <>
      <div
        className={`bg-white rounded-xl border shadow-sm transition-all ${
          isValid ? 'border-gray-200' : 'border-amber-300'
        }`}
      >
        <div className="p-3 md:p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
              {index + 1}
            </div>

            <div className={`flex-shrink-0 p-1.5 rounded-md ${TYPE_COLORS[question.type]}`}>
              <TypeIcon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                  {TYPE_LABELS[question.type]}
                </span>
                {!isValid && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                    <AlertCircle className="w-3 h-3" />
                    {validation.length}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">{preview}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              disabled={!canPreview}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                canPreview
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                  : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
              title={
                canPreview
                  ? 'Посмотреть, как этот вопрос увидит ученик'
                  : 'Сначала заполните текст вопроса'
              }
            >
              <Eye className="w-4 h-4" />
              <span>Посмотреть как у ученика</span>
            </button>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={index === 0}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Переместить вверх"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={index === total - 1}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Переместить вниз"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Удалить вопрос"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title={expanded ? 'Свернуть' : 'Развернуть'}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Свернуть</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span className="hidden sm:inline">Развернуть</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-100 p-4 md:p-5">
            {question.type === 'single' && (
              <SingleChoiceEditor
                questionText={question.questionText}
                options={question.options || ['', '']}
                correctAnswer={question.correctAnswers?.[0] || ''}
                subject={subject}
                onChange={patch => onChange({ ...patch, type: 'single' })}
              />
            )}

            {question.type === 'multiple' && (
              <MultipleChoiceEditor
                questionText={question.questionText}
                options={question.options || ['', '']}
                correctAnswers={question.correctAnswers || []}
                subject={subject}
                onChange={patch => onChange({ ...patch, type: 'multiple' })}
              />
            )}

            {question.type === 'expressionBuilder' && (
              <ExpressionBuilderEditor
                questionText={question.questionText}
                template={question.template || ''}
                placeholders={question.placeholders || []}
                availableItems={question.availableItems || []}
                subject={subject}
                onChange={patch => onChange({ ...patch, type: 'expressionBuilder' })}
              />
            )}

            {!isValid && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 space-y-0.5">
                    <p className="font-medium mb-1">Что нужно исправить:</p>
                    {validation.map((msg, i) => (
                      <p key={i}>• {msg}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <QuestionPreviewModal
        question={question}
        subject={subject}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
};