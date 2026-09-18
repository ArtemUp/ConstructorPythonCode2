import React from 'react';
import { RichText } from '@shared/ui/RichText';
import { cleanOption, cleanCorrectAnswers } from '@shared/lib/cleanOption';

interface SingleChoiceQuestionProps {
  question: {
    id: string;
    questionText: string;
    options: string[];
    correctAnswers: string[];
  };
  value: string | null;
  onChange: (value: string) => void;
}

export const SingleChoiceQuestion: React.FC<SingleChoiceQuestionProps> = ({
  question,
  value,
  onChange,
}) => {
  const safeValue = typeof value === 'string' ? value : null;

  // Очищаем варианты от лишнего (текст вопроса, блоки кода)
  const cleanedOptions = React.useMemo(
    () => (question.options || []).map(o => cleanOption(o, question.questionText)),
    [question.options, question.questionText]
  );

  // Очищаем правильные ответы тем же способом для корректного сравнения
  const cleanedCorrect = React.useMemo(
    () => cleanCorrectAnswers(question.correctAnswers || [], question.questionText),
    [question.correctAnswers, question.questionText]
  );

  return (
    <div className="space-y-3">
      {cleanedOptions.map((opt, idx) => {
        const isSelected = safeValue === opt;
        return (
          <label
            key={idx}
            className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
              isSelected
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <input
              type="radio"
              name={question.id}
              value={opt}
              checked={isSelected}
              onChange={e => onChange(e.target.value)}
              className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm md:text-base text-gray-800 break-words flex-1">
              <RichText text={opt} light />
            </span>
          </label>
        );
      })}
    </div>
  );
};