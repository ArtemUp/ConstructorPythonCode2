import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ListChecks,
  CheckSquare,
  Code2,
  FileQuestion,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { QuestionCard } from './QuestionCard';

type QuestionType = 'single' | 'multiple' | 'expressionBuilder';
type Subject = 'python' | 'math' | 'russian';

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

interface QuestionsListProps {
  questions: Question[];
  subject?: Subject;
  onChange: (questions: Question[]) => void;
}

// Заготовки для новых вопросов
const createEmptyQuestion = (type: QuestionType): Question => {
  const base = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    questionText: '',
  };

  switch (type) {
    case 'single':
      return {
        ...base,
        options: ['', ''],
        correctAnswers: [],
      };
    case 'multiple':
      return {
        ...base,
        options: ['', ''],
        correctAnswers: [],
      };
    case 'expressionBuilder':
      return {
        ...base,
        template: '',
        placeholders: [],
        availableItems: [],
      };
  }
};

// Типы вопросов для меню
const QUESTION_TYPES: {
  value: QuestionType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    value: 'single',
    label: 'Одиночный выбор',
    description: 'Один правильный вариант из нескольких',
    icon: ListChecks,
    color: 'blue',
  },
  {
    value: 'multiple',
    label: 'Множественный выбор',
    description: 'Несколько правильных вариантов',
    icon: CheckSquare,
    color: 'purple',
  },
  {
    value: 'expressionBuilder',
    label: 'Сборка выражения',
    description: 'Drag & drop: собрать код или формулу',
    icon: Code2,
    color: 'emerald',
  },
];

export const QuestionsList: React.FC<QuestionsListProps> = ({
  questions,
  subject = 'python',
  onChange,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // === Действия ===

  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion = createEmptyQuestion(type);
    onChange([...questions, newQuestion]);
    setShowMenu(false);
  };

  const handleChangeQuestion = (index: number, patch: Partial<Question>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    const q = questions[index];
    const isEmpty =
      !q.questionText.trim() &&
      (!q.options || q.options.every(o => !o.trim())) &&
      (!q.template || !q.template.trim());

    if (isEmpty || confirm(`Удалить вопрос ${index + 1}?`)) {
      onChange(questions.filter((_, i) => i !== index));
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...questions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const updated = [...questions];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  // === Валидация всех вопросов ===

  const invalidCount = React.useMemo(() => {
    return questions.filter(q => {
        if (!q.questionText || !String(q.questionText).trim()) return true;

        if (q.type === 'single') {
        const opts = (q.options || []).filter(o => String(o || '').trim());
        return opts.length < 2 || !q.correctAnswers?.[0];
        }
        if (q.type === 'multiple') {
        const opts = (q.options || []).filter(o => String(o || '').trim());
        return opts.length < 2 || !q.correctAnswers?.length;
        }
        if (q.type === 'expressionBuilder') {
        if (!q.template || !String(q.template).trim()) return true;
        const ph = q.placeholders || [];
        if (ph.length === 0) return true;
        if (ph.some(p => !String(p.expected ?? '').trim())) return true;
        if ((q.availableItems || []).length === 0) return true;
        }
        return false;
    }).length;
    }, [questions]);

  return (
    <div className="space-y-4">
      {/* ============ ЗАГОЛОВОК ============ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">
            Вопросы
          </h3>
          <span className="text-sm text-gray-500">
            ({questions.length})
          </span>
        </div>

        {/* Кнопка + Добавить с выпадающим меню */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            Добавить вопрос
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-20 overflow-hidden">
              {QUESTION_TYPES
                .filter(type => subject !== 'russian' || type.value !== 'expressionBuilder')
                .map(type => {
                const Icon = type.icon;
                const colorClasses = {
                  blue: 'bg-blue-100 text-blue-600',
                  purple: 'bg-purple-100 text-purple-600',
                  emerald: 'bg-emerald-100 text-emerald-600',
                }[type.color];

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleAddQuestion(type.value)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div
                      className={`flex-shrink-0 p-2 rounded-lg ${colorClasses}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============ СПИСОК ВОПРОСОВ ============ */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 md:p-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 mb-3">
            <FileQuestion className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">
            Пока нет вопросов
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Добавьте первый вопрос или загрузите тест из JSON
          </p>
          <div className="relative inline-block" ref={undefined}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              Добавить вопрос
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              total={questions.length}
              subject={subject}
              onChange={patch => handleChangeQuestion(idx, patch)}
              onDelete={() => handleDeleteQuestion(idx)}
              onMoveUp={() => handleMoveUp(idx)}
              onMoveDown={() => handleMoveDown(idx)}
            />
          ))}
        </div>
      )}

      {/* ============ СТАТУС-БАР ============ */}
      {questions.length > 0 && (
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border ${
            invalidCount === 0
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          {invalidCount === 0 ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800">
                Все {questions.length}{' '}
                {questions.length === 1
                  ? 'вопрос'
                  : questions.length < 5
                  ? 'вопроса'
                  : 'вопросов'}{' '}
                заполнены корректно
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-800">
                {invalidCount}{' '}
                {invalidCount === 1
                  ? 'вопрос требует'
                  : invalidCount < 5
                  ? 'вопроса требуют'
                  : 'вопросов требуют'}{' '}
                доработки
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};