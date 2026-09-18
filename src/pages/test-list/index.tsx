import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTests } from '@entities/test/api';
import { getCompletedTest } from '@entities/test/useCompletedTests';
import {
  FileText, Play, Clock, BookOpen, Loader2, AlertCircle, Plus, Search,
  LayoutGrid, Code2, Sigma, BookOpen as BookIcon, CheckCircle2, RotateCcw,
} from 'lucide-react';

type SubjectFilter = 'all' | 'python' | 'math' | 'russian';

export const TestListPage = () => {
  const navigate = useNavigate();
  const { data: tests, isLoading, error } = useTests();
  const [search, setSearch] = React.useState('');
  const [subjectFilter, setSubjectFilter] = React.useState<SubjectFilter>('all');

  // Считаем количество по каждому предмету
  const counts = React.useMemo(() => {
    const list = Array.isArray(tests) ? tests : [];
    return {
      all: list.length,
      python: list.filter((t: any) => t.subject === 'python').length,
      math: list.filter((t: any) => t.subject === 'math').length,
      russian: list.filter((t: any) => t.subject === 'russian').length,
    };
  }, [tests]);

  // Фильтрация
  const filteredTests = React.useMemo(() => {
    if (!Array.isArray(tests)) return [];
    let list = tests;

    if (subjectFilter !== 'all') {
      list = list.filter((t: any) => t.subject === subjectFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t: any) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [tests, search, subjectFilter]);

  // ---- Загрузка ----
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Загрузка тестов...</p>
        </div>
      </div>
    );
  }

  // ---- Ошибка ----
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-800 font-medium mb-1">Ошибка загрузки тестов</p>
          <p className="text-sm text-gray-500 mb-4">Проверьте подключение к серверу</p>
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

  // ---- Пусто ----
  if (!Array.isArray(tests) || tests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-5xl">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Пока нет доступных тестов
            </h1>
            <p className="text-gray-500 mb-6">
              Создайте первый тест в админ-панели, чтобы начать
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/admin/tests/new')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow"
              >
                <Plus className="w-4 h-4" />
                Создать тест
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                На главную
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-5xl">

        {/* ============ ШАПКА ============ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                  Доступные тесты
                </h1>
                <p className="text-xs md:text-sm text-gray-500">
                  Выберите тест для прохождения
                </p>
              </div>
            </div>

            <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap">
              Найдено: <b className="text-gray-800">{filteredTests.length}</b>
            </span>
          </div>

          {/* ---- Фильтр по предмету ---- */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => setSubjectFilter('all')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                subjectFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Все
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  subjectFilter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubjectFilter('python')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                subjectFilter === 'python'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Python
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  subjectFilter === 'python'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {counts.python}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubjectFilter('math')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                subjectFilter === 'math'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
              }`}
            >
              <Sigma className="w-4 h-4" />
              Математика
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  subjectFilter === 'math'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {counts.math}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSubjectFilter('russian')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                subjectFilter === 'russian'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-rose-300 hover:bg-rose-50'
              }`}
            >
              <BookIcon className="w-4 h-4" />
              Русский
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  subjectFilter === 'russian' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {counts.russian}
              </span>
            </button>
          </div>

          {/* ---- Поиск ---- */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию или описанию..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* ============ СПИСОК ТЕСТОВ ============ */}
        {filteredTests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-gray-500">
              {search.trim()
                ? `Ничего не найдено по запросу «${search}»`
                : subjectFilter === 'python'
                ? 'Нет тестов по Python'
                : subjectFilter === 'math'
                ? 'Нет тестов по математике'
                : subjectFilter === 'russian'
                ? 'Нет тестов по русскому'
                : 'Нет доступных тестов'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTests.map((test: any) => {
              const isMath = test.subject === 'math';
              const isRussian = test.subject === 'russian';
              const qCount = test.questions?.length || 0;
              const hasTimer = test.timeLimit && test.timeLimit > 0;
              const completed = getCompletedTest(test.id);

              return (
                <div
                  key={test.id}
                  className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-4 md:p-5 flex flex-col"
                >
                  {/* Бейдж «Пройден» */}
                  {completed && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Пройден
                    </div>
                  )}

                  <div
                    className={`h-1 -mx-4 md:-mx-5 -mt-4 md:-mt-5 mb-4 rounded-t-xl ${
                      isMath
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                        : isRussian
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                    }`}
                  />

                  <div className="flex items-start gap-3 mb-3 flex-1">
                    <div
                      className={`flex-shrink-0 p-2 rounded-lg ${
                        isMath ? 'bg-purple-100' : isRussian ? 'bg-rose-100' : 'bg-blue-100'
                      }`}
                    >
                      <FileText
                        className={`w-5 h-5 ${
                          isMath ? 'text-purple-600' : isRussian ? 'text-rose-600' : 'text-blue-600'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-gray-900 leading-snug mb-1 line-clamp-2 pr-14">
                        {test.title}
                      </h2>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {test.description || 'Без описания'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md ${
                        isMath
                          ? 'bg-purple-50 text-purple-700'
                          : isRussian
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {isMath ? (
                        <><Sigma className="w-3 h-3" />Математика</>
                      ) : isRussian ? (
                        <><BookIcon className="w-3 h-3" />Русский</>
                      ) : (
                        <><Code2 className="w-3 h-3" />Python</>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-gray-50 text-gray-600">
                      <FileText className="w-3 h-3" />
                      {qCount} {qCount === 1 ? 'вопрос' : qCount < 5 ? 'вопроса' : 'вопросов'}
                    </span>
                    {hasTimer && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-amber-50 text-amber-700">
                        <Clock className="w-3 h-3" />
                        {test.timeLimit} мин
                      </span>
                    )}
                  </div>

                  {completed && (
                    <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Результат:</span>
                        <span
                          className={`font-semibold ${
                            completed.percent >= 70
                              ? 'text-green-600'
                              : completed.percent >= 40
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {completed.score} / {completed.total} ({completed.percent}%)
                        </span>
                      </div>

                      {completed.elapsedSeconds !== undefined && (
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {completed.elapsedSeconds < 60
                              ? `${completed.elapsedSeconds} сек`
                              : `${Math.floor(completed.elapsedSeconds / 60)} мин`}
                          </span>
                          <span>
                            {new Date(completed.completedAt).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate(`/test/${test.id}`)}
                    className={`inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow group-hover:scale-[1.02] ${
                      completed
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {completed ? (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Пройти снова
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Начать тест
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ============ НИЖНЯЯ КНОПКА ============ */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            На главную
          </button>
        </div>

      </div>
    </div>
  );
};