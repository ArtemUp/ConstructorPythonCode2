import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import {
  BarChart3,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Coins,
  Zap,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCcw,
} from 'lucide-react';

interface Stats {
  totalGenerations: number;
  successful: number;
  failed: number;
  totalTokens: number;
  totalInputTokens: number;
  totalCompletionTokens: number;
  avgTokensPerTest: number;
  avgAttempts: number;
}

interface HistoryEntry {
  _id: string;
  topic: string;
  subject: string;
  questionCount: number;
  attempts: number;
  inputTokens: number;
  completionTokens: number;
  totalTokens: number;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

// Стоимость 1 токена YandexGPT Pro 5.1 ≈ 0,80 ₽ за 1000 токенов
const PRICE_PER_1000_TOKENS = 0.8;

const formatTokens = (n: number) => n.toLocaleString('ru-RU');

const formatRub = (tokens: number) => {
  const rub = (tokens / 1000) * PRICE_PER_1000_TOKENS;
  return `${rub.toFixed(2)} ₽`;
};

// Метаданные предметов: короткое/полное название и стили бейджа
const SUBJECT_META: Record<
  string,
  { short: string; full: string; badge: string }
> = {
  math: {
    short: 'Матем.',
    full: 'Математика',
    badge: 'bg-purple-50 text-purple-700',
  },
  russian: {
    short: 'Рус.',
    full: 'Русский язык',
    badge: 'bg-rose-50 text-rose-700',
  },
  python: {
    short: 'Python',
    full: 'Python',
    badge: 'bg-blue-50 text-blue-700',
  },
};

const getSubject = (s: string) =>
  SUBJECT_META[s] ?? {
    short: s,
    full: s,
    badge: 'bg-gray-100 text-gray-700',
  };

export const AiStatsPage = () => {
  const navigate = useNavigate();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<Stats>({
    queryKey: ['ai-stats'],
    queryFn: async () => (await apiClient.get('/ai/stats')).data,
  });

  const {
    data: history,
    isLoading: histLoading,
    refetch: refetchHistory,
  } = useQuery<HistoryEntry[]>({
    queryKey: ['ai-history'],
    queryFn: async () => (await apiClient.get('/ai/history')).data,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchHistory();
  };

  // Готовим карточки статов
  const statCards = stats
    ? [
        {
          label: 'Всего генераций',
          value: formatTokens(stats.totalGenerations || 0),
          icon: BarChart3,
          bg: 'bg-blue-100',
          text: 'text-blue-600',
        },
        {
          label: 'Успешных',
          value: formatTokens(stats.successful || 0),
          icon: CheckCircle2,
          bg: 'bg-green-100',
          text: 'text-green-600',
        },
        {
          label: 'Ошибок',
          value: formatTokens(stats.failed || 0),
          icon: XCircle,
          bg: 'bg-red-100',
          text: 'text-red-600',
        },
        {
          label: 'Всего токенов',
          value: formatTokens(stats.totalTokens || 0),
          sub: `≈ ${formatRub(stats.totalTokens || 0)}`,
          icon: Coins,
          bg: 'bg-amber-100',
          text: 'text-amber-600',
        },
        {
          label: 'Входные',
          value: formatTokens(stats.totalInputTokens || 0),
          sub: `≈ ${formatRub(stats.totalInputTokens || 0)}`,
          icon: Zap,
          bg: 'bg-purple-100',
          text: 'text-purple-600',
        },
        {
          label: 'Выходные',
          value: formatTokens(stats.totalCompletionTokens || 0),
          sub: `≈ ${formatRub(stats.totalCompletionTokens || 0)}`,
          icon: Zap,
          bg: 'bg-indigo-100',
          text: 'text-indigo-600',
        },
        {
          label: 'Средне на тест',
          value: formatTokens(Math.round(stats.avgTokensPerTest || 0)),
          sub: `≈ ${formatRub(stats.avgTokensPerTest || 0)}`,
          icon: TrendingUp,
          bg: 'bg-emerald-100',
          text: 'text-emerald-600',
        },
        {
          label: 'Средне попыток',
          value: (stats.avgAttempts || 0).toFixed(2),
          icon: RefreshCcw,
          bg: 'bg-cyan-100',
          text: 'text-cyan-600',
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-10 max-w-6xl">
        {/* ============ ЗАГОЛОВОК ============ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                    Статистика AI
                  </h1>
                  <p className="text-sm text-gray-500">
                    Расход токенов и история генераций
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors self-start sm:self-auto"
            >
              <RefreshCcw className="w-4 h-4" />
              Обновить
            </button>
          </div>
        </div>

        {/* ============ КАРТОЧКИ СТАТИСТИКИ ============ */}
        {statsLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center mb-6">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Загрузка статистики...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
                    <Icon className={`w-4 h-4 ${card.text}`} />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                  <p className="text-lg md:text-xl font-bold text-gray-900 break-words">
                    {card.value}
                  </p>
                  {card.sub && (
                    <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ============ ТАБЛИЦА ИСТОРИИ ============ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Последние 20 генераций
              </h2>
              <p className="text-sm text-gray-500">
                История обращений к YandexGPT
              </p>
            </div>
            {history && (
              <span className="text-sm text-gray-500 whitespace-nowrap">
                Записей: <b className="text-gray-800">{history.length}</b>
              </span>
            )}
          </div>

          {histLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Загрузка истории...</p>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                <AlertCircle className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500">Пока нет ни одной генерации</p>
            </div>
          ) : (
            <>
              {/* Десктопная таблица */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">
                        Дата
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">
                        Тема
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">
                        Предмет
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">
                        Вопросов
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">
                        Вход
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">
                        Выход
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">
                        Всего
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">
                        ₽
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">
                        Попыток
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(h => {
                      const subject = getSubject(h.subject);
                      return (
                        <tr
                          key={h._id}
                          className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                            {new Date(h.createdAt).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td
                            className="px-4 py-3 text-gray-800 max-w-[200px] truncate"
                            title={h.topic}
                          >
                            {h.topic}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-[11px] font-medium px-2 py-1 rounded-md ${subject.badge}`}
                            >
                              {subject.short}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {h.questionCount}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {formatTokens(h.inputTokens)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {formatTokens(h.completionTokens)}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-800">
                            {formatTokens(h.totalTokens)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500 whitespace-nowrap">
                            {formatRub(h.totalTokens)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                                h.attempts === 1
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {h.attempts}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {h.success ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                            ) : (
                              <XCircle
                                className="w-4 h-4 text-red-500 mx-auto"
                                title={h.errorMessage}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Мобильные карточки */}
              <div className="md:hidden divide-y divide-gray-100">
                {history.map(h => {
                  const subject = getSubject(h.subject);
                  return (
                    <div key={h._id} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <p
                            className="font-medium text-gray-900 text-sm truncate"
                            title={h.topic}
                          >
                            {h.topic}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(h.createdAt).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {h.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`text-[10px] font-medium px-2 py-1 rounded-md ${subject.badge}`}
                        >
                          {subject.full}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                          {h.questionCount} вопр.
                        </span>
                        <span className="text-[10px] font-medium px-2 py-1 rounded-md bg-amber-50 text-amber-700">
                          {h.attempts} попыт.
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-gray-500 text-[10px]">Вход</p>
                          <p className="font-semibold text-gray-800">
                            {formatTokens(h.inputTokens)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-gray-500 text-[10px]">Выход</p>
                          <p className="font-semibold text-gray-800">
                            {formatTokens(h.completionTokens)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-gray-500 text-[10px]">Всего</p>
                          <p className="font-semibold text-gray-800">
                            {formatTokens(h.totalTokens)}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        ≈ <b className="text-gray-700">{formatRub(h.totalTokens)}</b>
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ============ ПОДСКАЗКА О ТАРИФЕ ============ */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Тариф YandexGPT</p>
            <p className="text-blue-800">
              Расчёт стоимости: <b>{PRICE_PER_1000_TOKENS.toFixed(2)} ₽</b> за
              1000 токенов (модель YandexGPT Pro 5.1). Актуальные цифры можно
              проверить в{' '}
              <a
                href="https://console.cloud.yandex.ru/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-blue-700"
              >
                консоли Yandex Cloud
              </a>
              .
            </p>
          </div>
        </div>

        {/* ============ КНОПКА ВНИЗУ ============ */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            К админ-панели
          </button>
        </div>
      </div>
    </div>
  );
};