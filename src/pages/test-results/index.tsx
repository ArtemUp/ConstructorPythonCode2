import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MathText } from '@shared/ui/MathText';
import { RichText } from '@shared/ui/RichText';
import { cleanOption, cleanCorrectAnswers } from '@shared/lib/cleanOption';
import hljs from 'highlight.js';
import { CheckCircle2, XCircle, Home, RotateCcw, Clock, Flag } from 'lucide-react';
import { getCompletedTest } from '@entities/test/useCompletedTests';

export const TestResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    answers,
    test,
    elapsedSeconds: stateElapsed,
    flaggedIds: stateFlaggedIds,
  } = location.state || {};

  const completedFromStorage = test?.id ? getCompletedTest(test.id) : null;
  const elapsedSeconds = stateElapsed ?? completedFromStorage?.elapsedSeconds;
  const flaggedIds = React.useMemo(
    () => new Set<string>(stateFlaggedIds || []),
    [stateFlaggedIds]
  );

  if (!test || !answers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center max-w-md">
          <p className="text-gray-600 mb-4">Нет данных о результатах</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const isMath = test.subject === 'math';

  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds < 0) return '—';
    if (seconds < 60) return `${seconds} сек`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m} мин ${s} сек` : `${m} мин`;
  };

  // ============================================================
  // Подсчёт баллов: пропускаем отмеченные как «неверные»
  // ============================================================
  const calculateScore = () => {
    let correct = 0;
    let counted = 0;

    test.questions.forEach((q: any) => {
      if (flaggedIds.has(q.id)) return; // отмеченные не считаем
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

    return { correct, total: counted };
  };

  const { correct, total } = calculateScore();
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const totalFlagged = test.questions.filter((q: any) => flaggedIds.has(q.id)).length;

  // ============================================================
  // Рендер кода для expressionBuilder
  // ============================================================
  const renderCode = (code: string) => {
    if (isMath) {
      return (
        <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg mt-1 overflow-x-auto text-center">
          <MathText text={`$$${code}$$`} />
        </div>
      );
    }
    return (
      <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg mt-1 overflow-x-auto text-xs">
        <code
          className="language-python"
          style={{ color: '#f8f8f2' }}
          dangerouslySetInnerHTML={{
            __html: hljs.highlight(code, { language: 'python' }).value,
          }}
        />
      </pre>
    );
  };

  // ============================================================
  // Универсальная подстановка @@id@@ и {{id}}
  // ============================================================
  const applyPlaceholders = (q: any, getValue: (phId: string) => string): string => {
    let result = q.template || '';
    (q.placeholders || []).forEach((ph: any) => {
      const value = getValue(ph.id);
      result = result.replace(new RegExp(`\\{\\{${ph.id}\\}\\}`, 'g'), value);
      result = result.replace(new RegExp(`@@${ph.id}@@`, 'g'), value);
    });
    return result;
  };

  // ============================================================
  // Детали вопроса
  // ============================================================
  const renderDetails = (q: any, userAnswer: any) => {
    if (q.type === 'expressionBuilder') {
      const userCode = applyPlaceholders(q, phId => {
        const item = userAnswer?.[phId];
        return item ? String(item.content ?? '') : `[${phId}]`;
      });
      const expectedCode = applyPlaceholders(q, phId => {
        const ph = (q.placeholders || []).find((p: any) => p.id === phId);
        return ph?.expected ?? `[${phId}]`;
      });

      return (
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Ваш ответ
            </div>
            {renderCode(userCode)}
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Ожидалось
            </div>
            {renderCode(expectedCode)}
          </div>
        </div>
      );
    } else if (q.type === 'single') {
      const cleanedCorrect = cleanCorrectAnswers(q.correctAnswers || [], q.questionText);
      const cleanedUser = cleanOption(userAnswer, q.questionText);
      return (
        <div className="mt-3 text-sm space-y-1 bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="flex items-start gap-2">
            <span className="text-gray-600 flex-shrink-0">Ваш ответ:</span>
            <span className="font-medium">
              <MathText text={cleanedUser || '—'} />
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-600 flex-shrink-0">Правильный:</span>
            <span className="font-medium text-green-700">
              <MathText text={cleanedCorrect[0]} />
            </span>
          </div>
        </div>
      );
    } else if (q.type === 'multiple') {
      const cleanedCorrect = cleanCorrectAnswers(q.correctAnswers || [], q.questionText);
      const cleanedUser = (Array.isArray(userAnswer) ? userAnswer : []).map((a: string) =>
        cleanOption(a, q.questionText)
      );
      return (
        <div className="mt-3 text-sm space-y-1 bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="flex items-start gap-2">
            <span className="text-gray-600 flex-shrink-0">Выбрано:</span>
            <span className="font-medium">
              {cleanedUser.length ? (
                <>
                  {cleanedUser.map((ans, i) => (
                    <React.Fragment key={i}>
                      <MathText text={ans} />
                      {i < cleanedUser.length - 1 && <span>, </span>}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                '—'
              )}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-600 flex-shrink-0">Правильно:</span>
            <span className="font-medium text-green-700">
              {cleanedCorrect.map((ans, i) => (
                <React.Fragment key={i}>
                  <MathText text={ans} />
                  {i < cleanedCorrect.length - 1 && <span>, </span>}
                </React.Fragment>
              ))}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Цвет результата
  const scoreColor =
    percent >= 70 ? 'text-green-600' : percent >= 40 ? 'text-amber-600' : 'text-red-600';
  const scoreBg =
    percent >= 70 ? 'bg-green-50' : percent >= 40 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-10">
      <div className="container mx-auto max-w-3xl px-3 md:px-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* ============ ЗАГОЛОВОК С РЕЗУЛЬТАТОМ ============ */}
          <div className={`${scoreBg} p-6 md:p-8 text-center border-b border-gray-200`}>
            <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
              Результаты теста
            </h1>
            <p className="text-base md:text-lg text-gray-700 mb-3">{test.title}</p>
            <div className={`text-5xl md:text-6xl font-bold mb-3 ${scoreColor}`}>
              {percent}%
            </div>
            <p className="text-base md:text-lg text-gray-700">
              Правильных ответов: <b>{correct}</b> из <b>{total}</b>
            </p>

            {typeof elapsedSeconds === 'number' && elapsedSeconds > 0 && (
              <div className="inline-flex items-center gap-2 text-sm text-gray-600 mt-3 px-3 py-1.5 bg-white/60 rounded-lg">
                <Clock className="w-4 h-4" />
                <span>
                  Время прохождения:{' '}
                  <b className="text-gray-900">{formatDuration(elapsedSeconds)}</b>
                </span>
              </div>
            )}

            {totalFlagged > 0 && (
              <div className="inline-flex items-center gap-2 text-sm text-amber-700 mt-3 ml-2 px-3 py-1.5 bg-amber-100/70 rounded-lg">
                <Flag className="w-4 h-4 fill-amber-500 text-amber-600" />
                <span>
                  Отмечено как неверные:{' '}
                  <b className="text-amber-900">{totalFlagged}</b> (не в зачёте)
                </span>
              </div>
            )}
          </div>

          {/* ============ ДЕТАЛИЗАЦИЯ ============ */}
          <div className="p-5 md:p-8">
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-gray-900">
              Детализация
            </h2>

            <div className="space-y-4">
              {test.questions.map((q: any, idx: number) => {
                const isLast = idx === test.questions.length - 1;
                const userAnswer = answers[q.id];
                const isFlagged = flaggedIds.has(q.id);

                // Проверка правильности (неважно, если отмечен — для отображения деталей)
                let isCorrect = false;
                if (q.type === 'expressionBuilder') {
                  const allFilled = q.placeholders.every((ph: any) => userAnswer?.[ph.id]);
                  const allCorrect = q.placeholders.every(
                    (ph: any) => userAnswer?.[ph.id]?.content === ph.expected
                  );
                  isCorrect = allFilled && allCorrect;
                } else if (q.type === 'single') {
                  const cleanedCorrect = cleanCorrectAnswers(q.correctAnswers || [], q.questionText);
                  const cleanedUser = cleanOption(userAnswer, q.questionText);
                  isCorrect = cleanedCorrect[0] === cleanedUser;
                } else if (q.type === 'multiple') {
                  const cleanedCorrect = cleanCorrectAnswers(q.correctAnswers || [], q.questionText);
                  const cleanedUser = (Array.isArray(userAnswer) ? userAnswer : []).map(
                    (a: string) => cleanOption(a, q.questionText)
                  );
                  const userSet = new Set(cleanedUser);
                  const correctSet = new Set(cleanedCorrect);
                  isCorrect =
                    userSet.size === correctSet.size &&
                    [...userSet].every(v => correctSet.has(v));
                }

                // Иконка и цвет статуса
                let icon;
                if (isFlagged) {
                  icon = (
                    <Flag className="w-5 h-5 text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />
                  );
                } else if (isCorrect) {
                  icon = (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  );
                } else {
                  icon = (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  );
                }

                // Текст статуса
                let statusText;
                let statusClass;
                if (isFlagged) {
                  statusText = '⚠️ Отмечен как неверный — не учитывался';
                  statusClass = 'text-amber-600';
                } else if (isCorrect) {
                  statusText = 'Правильно';
                  statusClass = 'text-green-600';
                } else {
                  statusText = 'Неправильно';
                  statusClass = 'text-red-600';
                }

                return (
                  <div
                    key={q.id}
                    className={`pb-4 ${
                      !isLast ? 'border-b border-gray-100' : ''
                    } ${isFlagged ? 'bg-amber-50/40 -mx-3 px-3 rounded-lg' : ''}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {icon}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 break-words">
                          <span className="text-gray-500 text-sm mr-2">
                            Вопрос {idx + 1}:
                          </span>
                          <RichText text={q.questionText} light />
                        </div>
                        <p className={`text-sm mt-1 ${statusClass}`}>{statusText}</p>
                      </div>
                    </div>

                    {/* Детали — показываем для неправильных (кроме отмеченных, у них тоже полезно) */}
                    {!isCorrect && !isFlagged && renderDetails(q, userAnswer)}

                    {/* Для отмеченных — показываем детали, но с пометкой */}
                    {isFlagged && renderDetails(q, userAnswer)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============ КНОПКИ ============ */}
          <div className="p-5 md:p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={() => navigate('/tests')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              К списку тестов
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow"
            >
              <Home className="w-4 h-4" />
              На главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};