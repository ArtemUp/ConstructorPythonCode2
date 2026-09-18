import React from 'react';
import { RichText } from '@shared/ui/RichText';
import { cleanOption, cleanCorrectAnswers } from '@shared/lib/cleanOption';

interface MultipleChoiceQuestionProps {
  question: {
    id: string;
    questionText: string;
    options: string[];
    correctAnswers: string[];
  };
  value: string[];
  onChange: (value: string[]) => void;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  value,
  onChange,
}) => {
  const safeValue = Array.isArray(value) ? value : [];

  // Очищаем варианты от лишнего
  const cleanedOptions = React.useMemo(
    () => (question.options || []).map(o => cleanOption(o, question.questionText)),
    [question.options, question.questionText]
  );

  // Очищаем правильные ответы тем же способом
  const cleanedCorrect = React.useMemo(
    () => cleanCorrectAnswers(question.correctAnswers || [], question.questionText),
    [question.correctAnswers, question.questionText]
  );

  const toggleOption = (opt: string) => {
    if (safeValue.includes(opt)) {
      onChange(safeValue.filter(v => v !== opt));
    } else {
      onChange([...safeValue, opt]);
    }
  };

  return (
    <div className="space-y-3">
      {cleanedOptions.map((opt, idx) => {
        const isChecked = safeValue.includes(opt);
        return (
          <label
            key={idx}
            className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
              isChecked
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggleOption(opt)}
              className="mt-1 flex-shrink-0 w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
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