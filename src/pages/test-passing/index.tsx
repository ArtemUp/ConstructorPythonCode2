import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTest } from '@entities/test/api';
import { useTestStore } from '@entities/test/store';
import { saveCompletedTest } from '@entities/test/useCompletedTests';
import { ExpressionBuilder } from '@features/expression-builder/ExpressionBuilder';
import { SingleChoiceQuestion } from '@features/single-choice/SingleChoiceQuestion';
import { MultipleChoiceQuestion } from '@features/multiple-choice/MultipleChoiceQuestion';
import { RichText } from '@shared/ui/RichText';
import { ConfirmDialog } from '@shared/ui/ConfirmDialog';
import { cleanOption, cleanCorrectAnswers } from '@shared/lib/cleanOption';
import { apiClient } from '@shared/api/client';
import { notify } from '@shared/lib/toast';
import { ArrowLeft, ArrowRight, LogOut, Clock, CheckCircle2, Flag } from 'lucide-react';

interface Answer {
  [key: string]: any;
}

export const TestPassingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: test, isLoading, error } = useTest(id!);
  const { answers, setAnswer, clearAnswers, testId, setTestId } = useTestStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unansweredNums, setUnansweredNums] = useState<number[]>([]);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const finishedRef = useRef(false);
  const startTimeRef = useRef<number>(Date.now());

  // Сброс при переходе на другой тест
  useEffect(() => {
    if (!id) return;
    if (testId !== id) {
      clearAnswers();
      setTestId(id);
      finishedRef.current = false;
      startTimeRef.current = Date.now();
      setFlaggedIds(new Set());
    }
  }, [id, testId, clearAnswers, setTestId]);

  // Таймер
  useEffect(() => {
    if (test?.timeLimit && test.timeLimit > 0) {
      setTimeLeft(test.timeLimit * 60);
    }
  }, [test]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-gray-500">Загрузка теста...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 max-w-md text-center">
          <p className="text-red-600 mb-4">Ошибка загрузки теста</p>
          <button
            onClick={() => navigate('/tests')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            К списку тестов
          </button>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Тест не найден</p>
      </div>
    );
  }

  const questions = test.questions;
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLast = currentIndex === totalQuestions - 1;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleAnswer = (questionId: string, answer: Answer) => {
    setAnswer(questionId, answer);
  };

  const toggleFlag = (qId: string) => {
    setFlaggedIds(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const hasAnswer = (question: any, answer: any): boolean => {
    if (!answer) return false;
    switch (question.type) {
      case 'single':
        return typeof answer === 'string' && answer.length > 0;
      case 'multiple':
        return Array.isArray(answer) && answer.length > 0;
      case 'expressionBuilder': {
        if (typeof answer !== 'object') return false;
        return Object.values(answer).some(v => v !== null && v !== undefined);
      }
      default:
        return false;
    }
  };

  const saveFlagsToBackend = async (finalAnswers: Record<string, any>) => {
    if (flaggedIds.size === 0) return;

    const payload = Array.from(flaggedIds)
      .map(qId => {
        const q: any = questions.find((item: any) => item.id === qId);
        if (!q) return null;

        return {
          testId: test.id,
          testTitle: test.title,
          subject: test.subject,
          questionId: q.id,
          questionType: q.type,
          questionText: q.questionText,
          options: q.options || [],
          correctAnswers: q.correctAnswers || [],
          template: q.template || '',
          placeholders: q.placeholders || [],
          availableItems: q.availableItems || [],
          userAnswer: finalAnswers[q.id] || null,
        };
      })
      .filter(Boolean);

    if (payload.length === 0) return;

    try {
      await apiClient.post('/flagged', payload);
      console.log(`✅ Отправлено флагов: ${payload.length}`);
    } catch (err) {
      console.error('Ошибка отправки флагов:', err);
      notify.error('Не удалось сохранить отмеченные вопросы', 'Но тест завершён');
    }
  };

  const finishTest = async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    if (intervalRef.current) clearInterval(intervalRef.current);

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - startTimeRef.current) / 1000)
    );

    // Считаем результат — вопросы с флагом НЕ учитываются
    let correct = 0;
    let counted = 0; // сколько вопросов шло в зачёт

    test.questions.forEach((q: any) => {
      if (flaggedIds.has(q.id)) return; // пропускаем отмеченные
      counted++;

      const userAnswer = answers[q.id];
      if (!userAnswer) return;

      if (q.type === 'expressionBuilder') {
        const allFilled = q.placeholders.every((ph: any) => userAnswer[ph.id]);
        const allCorrect = q.placeholders.every(
          (ph: any) => userAnswer[ph.id]?.content === ph.expected
        );
        if (allFilled && allCorrect) correct++;
      } else if (q.type === 'single') {
        const cleanedCorrect = cleanCorrectAnswers(q.correctAnswers || [], q.questionText);
        const cleanedUser = cleanOption(userAnswer, q.questionText);
        if (cleanedCorrect[0] === cleanedUser) correct++;
      } else if (q.type === 'multiple') {
        const cleanedCorrect = cleanCorrectAnswers(q.correctAnswers || [], q.questionText);
        const cleanedUser = (userAnswer || []).map((a: string) =>
          cleanOption(a, q.questionText)
        );
        const userSet = new Set(cleanedUser);
        const correctSet = new Set(cleanedCorrect);
        if (
          userSet.size === correctSet.size &&
          [...userSet].every(v => correctSet.has(v))
        ) {
          correct++;
        }
      }
    });

    const total = counted;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Сохраняем историю
    saveCompletedTest({
      testId: test.id,
      testTitle: test.title,
      score: correct,
      total,
      percent,
      elapsedSeconds,
    });

    // Копируем ответы до очистки
    const finalAnswers = { ...answers };
    const finalTest = test;

    // Сохраняем флаги в фоне (не блокируем переход)
    saveFlagsToBackend(finalAnswers);

    clearAnswers();

    navigate(`/test/${id}/results`, {
      state: {
        answers: finalAnswers,
        test: finalTest,
        elapsedSeconds,
        flaggedIds: Array.from(flaggedIds),
      },
    });
  };

  const handleNext = () => {
    if (currentIndex === totalQuestions - 1) {
      const unanswered = questions
        .map((q: any, idx: number) => ({ q, idx }))
        .filter(({ q }: any) => !hasAnswer(q, answers[q.id]) && !flaggedIds.has(q.id));

      if (unanswered.length > 0) {
        setUnansweredNums(unanswered.map((u: any) => u.idx + 1));
        setConfirmOpen(true);
        return;
      }
      finishTest();
    } else {
      setCurrentIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderQuestion = () => {
    const question = currentQuestion;
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'expressionBuilder':
        return (
          <ExpressionBuilder
            template={question.template!}
            placeholders={question.placeholders!}
            availableItems={question.availableItems!}
            value={currentAnswer || {}}
            onChange={value => handleAnswer(question.id, value)}
            subject={test.subject as 'python' | 'math'}
          />
        );
      case 'single':
        return (
          <SingleChoiceQuestion
            question={question}
            value={currentAnswer || null}
            onChange={value => handleAnswer(question.id, value)}
          />
        );
      case 'multiple':
        return (
          <MultipleChoiceQuestion
            question={question}
            value={currentAnswer || []}
            onChange={value => handleAnswer(question.id, value)}
          />
        );
      default:
        return <div>Тип вопроса не поддерживается</div>;
    }
  };

  const isFlagged = flaggedIds.has(currentQuestion.id);
  const unansweredCount = unansweredNums.length;
  const wordForm =
    unansweredCount === 1 ? 'вопрос' : unansweredCount < 5 ? 'вопроса' : 'вопросов';

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-5xl">
          {/* ШАПКА */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 truncate">
                  {test.title}
                </h1>
                <p className="text-sm md:text-base text-gray-500 line-clamp-2">
                  {test.description}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {flaggedIds.size > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-50 text-amber-700 border border-amber-200">
                    <Flag className="w-4 h-4 fill-amber-500 text-amber-600" />
                    <span className="font-medium">{flaggedIds.size}</span>
                  </div>
                )}
                {timeLeft !== null && (
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm ${
                      timeLeft < 60
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>
                  Вопрос <b className="text-gray-800">{currentIndex + 1}</b> из{' '}
                  {totalQuestions}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* ВОПРОС */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-6 mb-4 md:mb-6">
            <div className="mb-5 md:mb-6 flex items-start justify-between gap-3">
              <RichText
                text={currentQuestion.questionText}
                className="flex-1 text-base md:text-xl font-semibold text-gray-900 leading-snug"
              />

              {/* Кнопка «Флаг» */}
              <button
                type="button"
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  isFlagged
                    ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-amber-300 hover:text-amber-700'
                }`}
                title={
                  isFlagged
                    ? 'Снять отметку «вопрос неверен»'
                    : 'Отметить вопрос как неверный (не пойдёт в зачёт)'
                }
              >
                <Flag
                  className={`w-4 h-4 ${isFlagged ? 'fill-amber-500 text-amber-600' : ''}`}
                />
                <span className="hidden sm:inline">
                  {isFlagged ? 'Вопрос неверен' : 'Отметить как неверный'}
                </span>
              </button>
            </div>

            {isFlagged && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <Flag className="w-4 h-4 flex-shrink-0 mt-0.5 fill-amber-500 text-amber-600" />
                <div>
                  Этот вопрос отмечен как некорректный. Он <b>не пойдёт в зачёт</b>, а мы
                  посмотрим его в админке и исправим.
                </div>
              </div>
            )}

            {renderQuestion()}
          </div>

          {/* НАВИГАЦИЯ */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 md:p-4 flex flex-col-reverse sm:flex-row sm:justify-between items-stretch sm:items-center gap-3">
            {currentIndex === 0 ? (
              <button
                type="button"
                onClick={() => navigate('/tests')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                К списку тестов
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all shadow-sm hover:shadow ${
                isLast
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Завершить тест
                </>
              ) : (
                <>
                  Далее
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ДИАЛОГ ПОДТВЕРЖДЕНИЯ */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title={`Вы не ответили на ${unansweredCount} ${wordForm}`}
        description={`Неотвеченные вопросы: ${unansweredNums.join(', ')}\n\nВсё равно завершить тест?`}
        confirmText="Завершить"
        cancelText="Вернуться"
        variant="danger"
        onConfirm={() => {
          setConfirmOpen(false);
          finishTest();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};